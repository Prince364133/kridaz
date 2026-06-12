# Networking Architecture

This document describes the new Dio-based networking stack added under
`lib/core/network`, `lib/core/storage`, `lib/core/error`, `lib/data/`,
`lib/domain/`, and `lib/presentation/features/`.

The existing `lib/services/api_service.dart` is **not removed** — the new
stack lives alongside it so screens can migrate one feature at a time.

---

## Layer diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  presentation/features/<feature>/                                │
│   ├ controllers/   ← AsyncNotifier; reads usecase providers      │
│   ├ screens/       ← consumes controller state                   │
│   └ widgets/                                                     │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  domain/  (PURE DART — no Flutter, no Dio, no Riverpod)          │
│   ├ entities/       ← business objects (User, AuthSession, …)    │
│   ├ repositories/   ← abstract contracts                         │
│   └ usecases/       ← one verb per file (LoginUseCase, …)        │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  data/                                                           │
│   ├ models/        ← Freezed DTOs (server shape)                 │
│   ├ datasources/   ← thin HTTP wrappers (no business logic)      │
│   └ repositories/  ← AuthRepositoryImpl — DTO → entity mapping   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  core/                                                           │
│   ├ network/       ← ApiClient (Dio) + interceptors              │
│   ├ storage/       ← SecureTokenStore, CacheStore                │
│   ├ error/         ← Failure sealed class + Result<T> + mapper   │
│   └ di/            ← Riverpod root providers                     │
└──────────────────────────────────────────────────────────────────┘
```

**Direction rule.** Imports point inward only:
`presentation → domain` and `data → domain`. `domain/` imports nothing
from above. `core/network` is the only place that imports Dio.

---

## Interceptor chain (registered in this order)

```dart
dio.interceptors.addAll([
  RequestIdInterceptor(),                                     // 1
  AuthInterceptor(tokenStore: …, refreshDio: …, dio: dio),    // 2
  RetryInterceptor(dio: dio),                                  // 3
  ErrorInterceptor(),                                          // 4
  if (kDebugMode) PrettyDioLogger(…),                          // 5
]);
```

| # | Interceptor | Purpose |
|---|---|---|
| 1 | `RequestIdInterceptor` | Adds `X-Request-Id: <uuid>` so server logs can be correlated with Flutter crash reports (Sentry will tag this automatically once wired). |
| 2 | `AuthInterceptor` | Injects `Authorization: Bearer <access>` on protected routes. On 401 + `TOKEN_EXPIRED`, runs a **single shared refresh** (no thundering herd) and replays the original request. Falls back to `onAuthFailure` for forced logout on `INVALID_TOKEN` / `TOKEN_COMPROMISE_DETECTED`. |
| 3 | `RetryInterceptor` | Exponential backoff with jitter on timeouts / 5xx / connection errors. **Never retries mutating verbs without `Idempotency-Key`** — that prevents double charges on POST /booking/create-order etc. |
| 4 | `ErrorInterceptor` | Last in chain. Wraps every `DioException` into a typed `ApiException` so callers only catch one error type. |
| 5 | `PrettyDioLogger` | Debug builds only. Pretty-prints request/response. Disabled in release. |

The refresh call goes through a **sibling `refreshDio`** that has no
`AuthInterceptor` — so a 401 on the refresh endpoint itself can't
recursively trigger another refresh.

---

## File map

```
lib/
├── core/
│   ├── network/
│   │   ├── api_client.dart                ← Dio facade + typed helpers
│   │   ├── api_response.dart              ← envelope { success, data, error, meta }
│   │   ├── api_exception.dart             ← server error codes
│   │   ├── network_info.dart              ← connectivity_plus wrapper
│   │   ├── ARCHITECTURE.md                ← this file
│   │   └── interceptors/
│   │       ├── request_id_interceptor.dart
│   │       ├── auth_interceptor.dart      ← single-flight 401 refresh
│   │       ├── retry_interceptor.dart     ← backoff + idempotency guard
│   │       ├── error_interceptor.dart     ← DioException → ApiException
│   │       └── logging_interceptor.dart   ← (placeholder)
│   ├── storage/
│   │   ├── secure_token_store.dart        ← Keystore/Keychain tokens
│   │   └── cache_store.dart               ← SharedPreferences JSON cache
│   ├── error/
│   │   ├── failures.dart                  ← sealed Failure hierarchy
│   │   ├── result.dart                    ← Result<T> = Ok | Err
│   │   └── exception_mapper.dart          ← ApiException → Failure
│   └── di/
│       └── core_providers.dart            ← apiClient, tokenStore, cache, network
│
├── data/
│   ├── models/auth/
│   │   ├── user_dto.dart                  ← @freezed, toDomain()
│   │   ├── auth_tokens_dto.dart           ← tolerant of legacy `token` field
│   │   ├── auth_response_dto.dart
│   │   └── login_request_dto.dart
│   ├── datasources/remote/
│   │   └── auth_remote_ds.dart            ← endpoint URLs only
│   └── repositories/
│       └── auth_repository_impl.dart      ← composes ds + tokenStore
│
├── domain/
│   ├── entities/
│   │   ├── user.dart
│   │   └── auth_session.dart
│   ├── repositories/
│   │   └── auth_repository.dart           ← abstract contract
│   └── usecases/
│       ├── login_usecase.dart
│       ├── logout_usecase.dart
│       └── get_current_user_usecase.dart
│
└── presentation/features/auth/
    ├── auth_providers.dart                ← repo + usecase providers
    └── controllers/
        └── login_controller.dart          ← worked example
```

---

## Bootstrap

1. **Install deps + run codegen** (one-time after pulling these files):

   ```bash
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   ```

   This generates `*.freezed.dart` and `*.g.dart` next to every DTO.

2. **Wire global logout on auth failure** in `main.dart` (or wherever you
   read `apiClientProvider`). The interceptor exposes a callback for this:

   ```dart
   final client = ref.read(apiClientProvider).raw;
   (client.interceptors.whereType<AuthInterceptor>().first)
       .onAuthFailure = () {
     ref.read(routerProvider).go('/login');
   };
   ```

3. **Use the controller** from any screen:

   ```dart
   class LoginScreen extends ConsumerWidget {
     @override
     Widget build(BuildContext context, WidgetRef ref) {
       final state = ref.watch(loginControllerProvider);
       return state.when(
         data: (session) => session == null
             ? _form(ref)
             : const SizedBox.shrink(),
         loading: () => const CircularProgressIndicator(),
         error: (e, _) => Text((e as Failure).message),
       );
     }
   }
   ```

---

## Migration plan from the existing `ApiService`

You do **not** have to rewrite every screen in one PR. Strategy:

1. **Today** — both stacks coexist. New features go through
   `apiClientProvider`. Existing screens keep calling `ApiService()`.

2. **Per feature (recommended order):**
   1. Auth (worked example here)
   2. Profile / `getMe`
   3. Booking flows (need `Idempotency-Key`)
   4. Reels / Chat / Story (cursor pagination)
   5. Wallet / Payment
   6. Everything else

3. **Steps for migrating one feature:**
   1. Create DTOs in `data/models/<feature>/` (Freezed).
   2. Add datasource in `data/datasources/remote/<feature>_remote_ds.dart`.
   3. Define entity + abstract repo in `domain/`.
   4. Implement repo in `data/repositories/`.
   5. Add Riverpod providers in `presentation/features/<feature>/<feature>_providers.dart`.
   6. Convert one screen to read the new controller. Delete the old
      `ApiService` method when the last screen is off it.

4. **Stop adding to `lib/services/api_service.dart`.** Once empty, delete.

---

## What NOT to do

* Don't pass `UserDto` into widgets — convert to `User` first.
* Don't `throw` from inside controllers — use `Result.fold`.
* Don't use `SharedPreferences` for tokens — use `SecureTokenStore`.
* Don't retry POSTs without an `Idempotency-Key` header — see
  `RetryInterceptor`.
* Don't set `connectTimeout > 15s` — mobile UX dies; the user will
  swipe away.
* Don't import `dio` outside `core/network/` — datasources call
  `ApiClient`, not Dio.
