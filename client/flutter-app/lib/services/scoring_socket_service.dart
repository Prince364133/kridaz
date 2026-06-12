import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_config.dart';
import '../models/scoring_models.dart';

/// Live match socket. Joins a match room and streams score snapshots,
/// ball events and match-end signals broadcast by the scoring engine.
///
/// Event names mirror `@kridaz/shared-constants/socketEvents` and
/// `server/config/socket.js`:
///   - emit:  joinMatch · scoring:acquire_lock · scoring:release_lock
///   - recv:  scoreUpdated · ballEvent · matchEnded ·
///            scoring:lock_granted · scoring:lock_denied · scoring:lock_released
///
/// The scoring-lock protocol prevents two scorers from updating the same match
/// in parallel. The first connect with `acquireLock()` either gets the lock or
/// is told to wait. When the holder releases (or disconnects), all waiters get
/// `scoring:lock_released` and this service auto-re-acquires.
class ScoringSocketService {
  // ── Singleton ─────────────────────────────────────────────────────────────
  // One Socket.IO connection per app session. Multiple screens (live tab,
  // scoreboard, scoring keypad, analytics) share the same instance and
  // refcount themselves into the current match room. The last screen out
  // releases the lock and the join, but the socket itself stays warm
  // until the app shuts down or the user logs out.
  static final ScoringSocketService _instance =
      ScoringSocketService._internal();
  factory ScoringSocketService() => _instance;
  ScoringSocketService._internal();

  io.Socket? _socket;
  String? _matchId;
  bool _wantsLock = false;
  bool _hasLock = false;

  /// Fires after a Socket.IO reconnect. Listeners should re-fetch the
  /// authoritative state over HTTP (`/scoring/live-score/:id`) — sockets
  /// may have missed events while we were disconnected.
  final _reconnectController = StreamController<void>.broadcast();
  Stream<void> get reconnectStream => _reconnectController.stream;

  final _scoreController = StreamController<LiveScoreSnapshot>.broadcast();
  final _ballController = StreamController<Map<String, dynamic>>.broadcast();
  final _endedController = StreamController<void>.broadcast();
  final _lockGrantedController = StreamController<void>.broadcast();
  final _lockDeniedController = StreamController<void>.broadcast();

  Stream<LiveScoreSnapshot> get scoreStream => _scoreController.stream;
  Stream<Map<String, dynamic>> get ballStream => _ballController.stream;
  Stream<void> get matchEndedStream => _endedController.stream;

  /// Fires when the server has granted exclusive scoring rights for this
  /// match. Scoring controls in the UI should only be enabled while this
  /// stream's latest event is "granted" (track via [hasLock]).
  Stream<void> get lockGrantedStream => _lockGrantedController.stream;

  /// Fires when another scorer holds the lock. The UI should show a "waiting"
  /// state. The service will auto-retry once the holder releases.
  Stream<void> get lockDeniedStream => _lockDeniedController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// True between a `lock_granted` and either a `disconnect` or a deliberate
  /// `releaseLock()`. Useful as a synchronous check in widget builders.
  bool get hasLock => _hasLock;

  void connect(String matchId, {String? token}) {
    _matchId = matchId;
    if (_socket?.connected == true) {
      _join();
      if (_wantsLock) _emitAcquireLock();
      return;
    }

    final builder =
        io.OptionBuilder().setTransports(['websocket']).disableAutoConnect();
    if (token != null) {
      builder.setExtraHeaders({'Authorization': 'Bearer $token'}).setAuth(
          {'token': token});
    }

    _socket = io.io(ApiConfig.socketUrl, builder.build());
    _socket!.connect();

    _socket!.onConnect((_) {
      _join();
      // If a caller asked for the lock before we were connected, request it
      // now that we have a socket.id the server can pin the lock to.
      if (_wantsLock) _emitAcquireLock();
    });
    _socket!.onReconnect((_) {
      _join();
      if (_wantsLock) _emitAcquireLock();
      // Tell every listener to re-sync over HTTP — we may have missed
      // events while the socket was down.
      _reconnectController.add(null);
    });

    _socket!.on('scoreUpdated', (data) {
      if (data is Map) {
        _scoreController
            .add(LiveScoreSnapshot.fromJson(Map<String, dynamic>.from(data)));
      }
    });

    _socket!.on('ballEvent', (data) {
      if (data is Map) {
        _ballController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.on('matchEnded', (_) => _endedController.add(null));

    _socket!.on('scoring:lock_granted', (_) {
      _hasLock = true;
      _lockGrantedController.add(null);
    });

    _socket!.on('scoring:lock_denied', (_) {
      _hasLock = false;
      _lockDeniedController.add(null);
    });

    // When the holder releases, the server broadcasts to everyone in the
    // `scoring_wait_<matchId>` room. If we still want the lock, retry now.
    _socket!.on('scoring:lock_released', (_) {
      _hasLock = false;
      if (_wantsLock) _emitAcquireLock();
    });
  }

  void _join() {
    final id = _matchId;
    if (id != null) _socket?.emit('joinMatch', id);
  }

  void _emitAcquireLock() {
    final id = _matchId;
    if (id == null) return;
    _socket?.emit('scoring:acquire_lock', {'matchId': id});
  }

  /// Request exclusive scoring rights. Result lands asynchronously on
  /// [lockGrantedStream] / [lockDeniedStream]. Safe to call before the socket
  /// has connected — the request will be queued and fired on first connect.
  void acquireLock() {
    _wantsLock = true;
    if (_socket?.connected == true) _emitAcquireLock();
  }

  /// Voluntarily give up the lock (e.g. when the user closes the scoring
  /// screen). Other waiters will be notified by the server's
  /// `scoring:lock_released` broadcast.
  void releaseLock() {
    _wantsLock = false;
    _hasLock = false;
    final id = _matchId;
    if (id == null) return;
    _socket?.emit('scoring:release_lock', {'matchId': id});
  }

  /// Drop the current match room without tearing down the socket. Safe
  /// to call from a screen's dispose() — the next screen reuses the warm
  /// connection on its own `connect(matchId)`.
  void leaveCurrentMatch() {
    if (_wantsLock) releaseLock();
    final id = _matchId;
    if (id != null) _socket?.emit('leaveMatch', id);
    _matchId = null;
  }

  /// Hard disconnect — call on logout. The singleton instance is reused
  /// after a future re-login, so we keep the StreamControllers alive.
  void disconnect() {
    if (_wantsLock) releaseLock();
    _socket?.disconnect();
    _socket = null;
    _matchId = null;
    _hasLock = false;
    _wantsLock = false;
  }
}
