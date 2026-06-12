// We delegate request/response logging to `pretty_dio_logger` directly in
// `ApiClient.build` (debug-mode only). This file is kept as a placeholder
// so the directory layout matches the architecture documented in
// `lib/core/network/ARCHITECTURE.md` — if you need custom log redaction
// later (e.g. masking Authorization headers in shipped builds), add a
// thin Interceptor here and swap it in for PrettyDioLogger.
