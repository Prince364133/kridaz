import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/country_codes.dart';
import '../../models/team_model.dart';
import '../../models/turf_model.dart';
import '../../models/official_model.dart';
import '../../services/team_service.dart';
import '../../services/turf_service.dart';
import '../../services/game_service.dart';
import '../../services/user_service.dart';
import '../teams/contact_picker_sheet.dart';
import 'scoring_theme.dart';

/// Picked player record. `id` is `null` for custom-added players.
typedef PickedPlayer = ({
  String name,
  String role,
  String? id,
  bool isCustom,
  String? phone,
  String? avatar,
});

/// Final config payload returned when the user confirms setup.
class StartScoringResult {
  final String matchName;
  final String
      format; // T20 | T10 | ODI | THE_HUNDRED | TEST | 5_DAY | 90_OVERS | 1_WEEK | CUSTOM
  final int overs;
  final String ballType; // TENNIS | LEATHER | WHITE | PINK | RUBBER
  final String groundType; // OUTDOOR | INDOOR | TURF
  final String timing; // DAY | NIGHT | D_N
  final String pitchType; // ROUGH | CEMENT | TURF | ASTRO_TURF | MATTING
  final DateTime? matchDate;
  // Venue — either picked from the grounds list (`venueId` populated) or typed
  // in by the user (`venueName` populated, `venueId` null). For a custom venue
  // entered via the popup, [customVenueLat]/[customVenueLng] carry the GPS
  // coords so the backend can store the location point too.
  final String? venueId;
  final String venueName;
  final double? customVenueLat;
  final double? customVenueLng;
  // Teams — `*Id` populated when picked from the user's team library, null
  // when the team name is typed in fresh.
  final String? teamAId;
  final String? teamBId;
  final String teamAName;
  final String teamBName;
  final List<PickedPlayer> teamAPlayers;
  final List<PickedPlayer> teamBPlayers;
  // Officials
  final String? umpireId;
  final String? umpireName;
  final String? scorerName;
  final String? streamerName;
  // Streaming + auth gate
  final String? youtubeLiveUrl;
  final String? scoringPassword;
  // Powerplay overs (default 6 for T20).
  final int powerPlayOvers;
  // Players per side. 11 for standard cricket; lower for small-side formats.
  final int maxMembers;
  // Pre-set toss (optional — usually decided after the coin flip in the live
  // TossModal, but the web modal allows pre-setting on review).
  final String? tossWinner; // 'teamA' | 'teamB' | null
  final String tossDecision; // 'BAT' | 'BOWL'
  // House rules set on step 6. Only the keys the user actually touched are
  // present; missing keys mean "use MCC default". Sent verbatim to the
  // backend at /scoring/setup so the scoring engine sees them from ball 1.
  final Map<String, dynamic> houseRules;

  const StartScoringResult({
    required this.matchName,
    required this.format,
    required this.overs,
    required this.ballType,
    required this.groundType,
    required this.timing,
    required this.pitchType,
    required this.matchDate,
    required this.venueId,
    required this.venueName,
    this.customVenueLat,
    this.customVenueLng,
    required this.teamAId,
    required this.teamBId,
    required this.teamAName,
    required this.teamBName,
    required this.teamAPlayers,
    required this.teamBPlayers,
    required this.umpireId,
    required this.umpireName,
    required this.scorerName,
    required this.streamerName,
    required this.youtubeLiveUrl,
    required this.scoringPassword,
    required this.powerPlayOvers,
    required this.maxMembers,
    required this.tossWinner,
    required this.tossDecision,
    required this.houseRules,
  });
}

const _formats = <(String, String, String)>[
  ('T20', 'T20', '20 Overs'),
  ('T10', 'T10', '10 Overs'),
  ('ODI', 'ODI', '50 Overs'),
  ('THE_HUNDRED', 'The Hundred', '100 Balls'),
  ('TEST', 'Test Match', '5 Days'),
  ('5_DAY', '5 Day Match', '90 Overs/day'),
  ('90_OVERS', '90 Overs', '1 Day'),
  ('1_WEEK', 'One Week', 'Multi-day'),
  ('CUSTOM', 'Custom', 'Set your own overs'),
];

const _balls = <(String, String, String)>[
  ('TENNIS', 'Tennis Ball', '🎾'),
  ('LEATHER', 'Leather Ball', '🏏'),
  ('WHITE', 'White Ball', '⚪'),
  ('PINK', 'Pink Ball', '🔴'),
  ('RUBBER', 'Rubber Ball', '⚫'),
];

const _grounds = <(String, String, String)>[
  ('OUTDOOR', 'Outdoor Ground', '🌳'),
  ('INDOOR', 'Indoor Ground', '🏟️'),
  ('TURF', 'Artificial Turf', '🟩'),
];

const _timings = <(String, String, String)>[
  ('DAY', 'Day Match', '☀️'),
  ('NIGHT', 'Night Match', '🌙'),
  ('D_N', 'Day/Night', '🌅'),
];

const _pitches = <(String, String)>[
  ('ROUGH', 'Rough'),
  ('CEMENT', 'Cement'),
  ('TURF', 'Turf'),
  ('ASTRO_TURF', 'Astro Turf'),
  ('MATTING', 'Matting'),
];

const _stepLabels = [
  'Match Setup',
  'Select Teams',
  'Playing XIs',
  'Scoring Password',
  'Add-ons',
  'House Rules',
  'Review',
];

/// Minimum length for the scoring password. The web sets the same floor.
const _kMinScoringPasswordLength = 4;

/// Flutter port of `StartScoringModal.jsx` — the 5-step match setup wizard.
/// Native Flutter patterns are used for date/time picking and player lookup;
/// the field set and step order mirror the web flow.
class StartScoringModal extends StatefulWidget {
  final void Function(StartScoringResult) onConfirm;
  final VoidCallback onClose;

  const StartScoringModal({
    super.key,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<StartScoringModal> createState() => _StartScoringModalState();
}

class _StartScoringModalState extends State<StartScoringModal> {
  int _step = 1;

  // Step 1
  final _matchName = TextEditingController(text: 'Match');
  String _format = 'T20';
  int _customOvers = 20;
  String _ballType = 'LEATHER';
  String _groundType = 'OUTDOOR';
  String _timing = 'DAY';
  String _pitchType = 'TURF';
  DateTime? _date;
  // 11 = standard XI cricket. The stepper in step 1 lets the scorer drop to
  // a smaller side (e.g. 7-a-side gully cricket) or bump it for over-strength
  // setups. Maps to the backend's `maxMembers` field.
  int _maxMembers = 11;

  // Step 2
  final _teamA = TextEditingController(text: 'Team A');
  final _teamB = TextEditingController(text: 'Team B');
  TeamModel? _teamAPicked;
  TeamModel? _teamBPicked;

  // Cached team lists for the picker sheet.
  List<TeamModel>? _myTeams;
  List<TeamModel>? _opponentTeams;
  bool _loadingTeams = false;

  // Step 3
  final List<PickedPlayer> _teamAPlayers = [];
  final List<PickedPlayer> _teamBPlayers = [];

  // Step 4
  final _venue = TextEditingController();
  final _umpire = TextEditingController();
  final _scorer = TextEditingController();
  final _streamer = TextEditingController();
  final _youtubeUrl = TextEditingController();
  final _scoringPassword = TextEditingController();
  // Confirmation pair for the dedicated mandatory password step.
  final _scoringPasswordConfirm = TextEditingController();
  bool _passwordObscured = true;
  String? _venueId;
  String? _umpireId;
  int _powerPlayOvers = 6;
  // Populated when the scorer adds a custom venue via the GPS-detect sheet.
  // Sent to the backend alongside the typed-in name so the venue can be
  // pinned on a map later without us having to re-geocode.
  double? _customVenueLat;
  double? _customVenueLng;

  // Add-ons (step 5) shows VENUE / PROS / STREAMING as inner tabs. The old
  // RULES tab was promoted to its own step (step 6 — House Rules) so it has
  // room to host every toggle the live umpire would otherwise hunt for from
  // the in-match house-rules sheet.
  int _addonsTab = 0;

  // ── Step 6: House Rules ────────────────────────────────────────────────────
  // Tri-state toggles: null = MCC default (don't send to backend), true/false
  // = explicit override. Int fields hold null for "use MCC" and an int for an
  // override. The keys mirror the in-match house-rules sheet so the backend
  // sees the same payload shape whether you set the rules at creation or
  // mid-match.
  bool? _enforceFreeHit;
  bool? _enforceConsecutiveOverBlock;
  bool? _penaltyEnabled;
  bool? _wideIsLegalBall;
  bool? _noBallIsLegalBall;
  bool? _lastManStands;
  final _ballsPerOverCtrl = TextEditingController();
  final _playersPerTeamCtrl = TextEditingController();
  final _maxRunsPerBallCtrl = TextEditingController();

  // Cached grounds list — umpires are now cached inside _UmpirePickerSheet
  // (per-role) so the parent doesn't need to plumb them through.
  List<TurfModel>? _venueOptions;
  bool _loadingGrounds = false;

  // Step 5 (toss is collected after the coin flip in the live TossModal — kept
  // here only so the result payload can express it if needed in the future).
  String? _tossWinner; // 'teamA' | 'teamB'
  String _tossDecision = 'BAT';

  @override
  void dispose() {
    _matchName.dispose();
    _teamA.dispose();
    _teamB.dispose();
    _venue.dispose();
    _umpire.dispose();
    _scorer.dispose();
    _streamer.dispose();
    _youtubeUrl.dispose();
    _scoringPassword.dispose();
    _scoringPasswordConfirm.dispose();
    _ballsPerOverCtrl.dispose();
    _playersPerTeamCtrl.dispose();
    _maxRunsPerBallCtrl.dispose();
    super.dispose();
  }

  // Pick the format-appropriate powerplay overs default. T20 → 6, T10 → 3,
  // ODI → 10, otherwise leave at whatever the user set last.
  void _updatePowerPlayDefault() {
    switch (_format) {
      case 'T20':
        _powerPlayOvers = 6;
        break;
      case 'T10':
        _powerPlayOvers = 3;
        break;
      case 'ODI':
        _powerPlayOvers = 10;
        break;
      default:
        // Keep current value.
        break;
    }
  }

  int get _resolvedOvers {
    switch (_format) {
      case 'T20':
        return 20;
      case 'T10':
        return 10;
      case 'ODI':
        return 50;
      case 'THE_HUNDRED':
        return 17; // ~100 balls
      case 'TEST':
      case '5_DAY':
      case '90_OVERS':
      case '1_WEEK':
        return 90;
      case 'CUSTOM':
      default:
        return _customOvers;
    }
  }

  bool get _canAdvance {
    switch (_step) {
      case 1:
        return _matchName.text.trim().isNotEmpty;
      case 2:
        return _teamA.text.trim().isNotEmpty && _teamB.text.trim().isNotEmpty;
      case 3:
        // Players per side is hard-enforced. Both XIs must sit exactly on
        // the count the user chose in step 1 — pick fewer and they're told
        // to add more; pick more (e.g. by loading a 15-strong squad for an
        // 11-a-side game) and the squad picker forces a trim.
        return _teamAPlayers.length == _maxMembers &&
            _teamBPlayers.length == _maxMembers;
      case 4:
        // Mandatory password — must meet the minimum length and the two
        // fields must match. The scorer enters this on the review screen
        // before the live scorer opens, so a typo here would lock them out.
        final p = _scoringPassword.text;
        final c = _scoringPasswordConfirm.text;
        return p.length >= _kMinScoringPasswordLength && p == c;
      case 5:
        return true;
      case 6:
        return _houseRulesValid;
      case 7:
        return true;
      default:
        return false;
    }
  }

  void _next() {
    if (_step < 7) {
      HapticFeedback.selectionClick();
      setState(() => _step++);
    } else {
      HapticFeedback.mediumImpact();
      widget.onConfirm(_result());
    }
  }

  void _back() {
    if (_step > 1) {
      setState(() => _step--);
    } else {
      widget.onClose();
    }
  }

  StartScoringResult _result() => StartScoringResult(
        matchName: _matchName.text.trim(),
        format: _format,
        overs: _resolvedOvers,
        ballType: _ballType,
        groundType: _groundType,
        timing: _timing,
        pitchType: _pitchType,
        matchDate: _date,
        venueId: _venueId,
        venueName: _venue.text.trim(),
        customVenueLat: _customVenueLat,
        customVenueLng: _customVenueLng,
        teamAId: _teamAPicked?.id,
        teamBId: _teamBPicked?.id,
        teamAName: _teamA.text.trim(),
        teamBName: _teamB.text.trim(),
        teamAPlayers: List.unmodifiable(_teamAPlayers),
        teamBPlayers: List.unmodifiable(_teamBPlayers),
        umpireId: _umpireId,
        umpireName: _umpire.text.trim().isEmpty ? null : _umpire.text.trim(),
        scorerName: _scorer.text.trim().isEmpty ? null : _scorer.text.trim(),
        streamerName:
            _streamer.text.trim().isEmpty ? null : _streamer.text.trim(),
        youtubeLiveUrl:
            _youtubeUrl.text.trim().isEmpty ? null : _youtubeUrl.text.trim(),
        scoringPassword: _scoringPassword.text.trim().isEmpty
            ? null
            : _scoringPassword.text.trim(),
        powerPlayOvers: _powerPlayOvers,
        maxMembers: _maxMembers,
        tossWinner: _tossWinner,
        tossDecision: _tossDecision,
        houseRules: _collectHouseRules(),
      );

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black,
      child: SafeArea(
        child: Column(
          children: [
            _header(),
            _stepperBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _stepBody(),
              ),
            ),
            _bottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: widget.onClose,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.x, color: Colors.white54, size: 16),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('STEP $_step OF 7',
                    style: const TextStyle(
                        color: ScoringTheme.accentSky,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
                const SizedBox(height: 2),
                Text(_stepLabels[_step - 1].toUpperCase(),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepperBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        children: List.generate(7, (i) {
          final active = _step >= i + 1;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: i == 6 ? 0 : 6),
              height: 4,
              decoration: BoxDecoration(
                color: active
                    ? ScoringTheme.theme
                    : Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _stepBody() {
    switch (_step) {
      case 1:
        return _stepMatchSetup();
      case 2:
        return _stepTeams();
      case 3:
        return _stepXIs();
      case 4:
        return _stepScoringPassword();
      case 5:
        return _stepAddons();
      case 6:
        return _stepHouseRules();
      case 7:
        return _stepReview();
      default:
        return const SizedBox();
    }
  }

  // ── Step 1: Match Setup ────────────────────────────────────────────────────

  Widget _stepMatchSetup() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('Match Name'),
        _textField(_matchName, hint: 'e.g. Friday League Final'),
        const SizedBox(height: 20),
        _label('Format'),
        _grid<String>(
          values: _formats.map((f) => f.$1).toList(),
          labels: _formats.map((f) => '${f.$2} • ${f.$3}').toList(),
          selected: _format,
          onSelect: (v) => setState(() {
            _format = v;
            _updatePowerPlayDefault();
          }),
          crossAxisCount: 2,
          aspectRatio: 3,
        ),
        if (_format == 'CUSTOM') ...[
          const SizedBox(height: 16),
          _label('Custom Overs'),
          Row(
            children: [
              Expanded(
                child: Slider(
                  value: _customOvers.toDouble(),
                  min: 5,
                  max: 120,
                  divisions: 115,
                  activeColor: ScoringTheme.theme,
                  inactiveColor: Colors.white24,
                  onChanged: (v) => setState(() => _customOvers = v.round()),
                ),
              ),
              SizedBox(
                width: 60,
                child: Text('$_customOvers',
                    textAlign: TextAlign.end,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900)),
              ),
            ],
          ),
        ],
        const SizedBox(height: 20),
        _label('Ball Type'),
        _grid<String>(
          values: _balls.map((b) => b.$1).toList(),
          labels: _balls.map((b) => '${b.$3} ${b.$2}').toList(),
          selected: _ballType,
          onSelect: (v) => setState(() => _ballType = v),
          crossAxisCount: 2,
          aspectRatio: 3.4,
        ),
        const SizedBox(height: 20),
        _label('Ground Type'),
        _grid<String>(
          values: _grounds.map((g) => g.$1).toList(),
          labels: _grounds.map((g) => '${g.$3} ${g.$2}').toList(),
          selected: _groundType,
          onSelect: (v) => setState(() => _groundType = v),
          crossAxisCount: 1,
          aspectRatio: 7,
        ),
        const SizedBox(height: 20),
        _label('Match Timing'),
        _grid<String>(
          values: _timings.map((t) => t.$1).toList(),
          labels: _timings.map((t) => '${t.$3} ${t.$2}').toList(),
          selected: _timing,
          onSelect: (v) => setState(() => _timing = v),
          crossAxisCount: 3,
          aspectRatio: 1.6,
        ),
        const SizedBox(height: 20),
        _label('Pitch Type'),
        _grid<String>(
          values: _pitches.map((p) => p.$1).toList(),
          labels: _pitches.map((p) => p.$2).toList(),
          selected: _pitchType,
          onSelect: (v) => setState(() => _pitchType = v),
          crossAxisCount: 3,
          aspectRatio: 2.2,
        ),
        const SizedBox(height: 20),
        _label('Match Date & Time'),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _date ?? DateTime.now(),
              firstDate: DateTime.now().subtract(const Duration(days: 30)),
              lastDate: DateTime.now().add(const Duration(days: 365)),
              builder: (ctx, child) => Theme(
                data: ThemeData.dark().copyWith(
                  colorScheme: const ColorScheme.dark(
                      primary: ScoringTheme.theme,
                      onPrimary: Colors.black,
                      surface: Color(0xFF111111)),
                ),
                child: child!,
              ),
            );
            if (picked == null || !mounted) return;
            final time = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
              builder: (ctx, child) => Theme(
                data: ThemeData.dark().copyWith(
                  colorScheme: const ColorScheme.dark(
                      primary: ScoringTheme.theme,
                      onPrimary: Colors.black,
                      surface: Color(0xFF111111)),
                ),
                child: child!,
              ),
            );
            if (!mounted) return;
            setState(() => _date = DateTime(picked.year, picked.month,
                picked.day, time?.hour ?? 0, time?.minute ?? 0));
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.calendar,
                    color: ScoringTheme.accentSky, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _date == null
                        ? 'Pick a date and time'
                        : _formatDate(_date!),
                    style: TextStyle(
                        color: _date == null ? Colors.white38 : Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700),
                  ),
                ),
                const Icon(LucideIcons.chevronRight,
                    color: Colors.white38, size: 16),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        _label('Players per side'),
        _maxMembersStepper(),
      ],
    );
  }

  /// Compact -/+/value stepper for the `maxMembers` field. Defaults to 11
  /// (standard cricket); the web allows 1-25 but practical lower bound is 6
  /// (two batters, four bowlers minimum for a real game) and upper bound is
  /// 11 unless the user specifically wants over-strength.
  Widget _maxMembersStepper() {
    void delta(int d) {
      final next = (_maxMembers + d).clamp(2, 25);
      setState(() => _maxMembers = next);
    }

    Widget btn(IconData icon, VoidCallback onTap) => GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
        );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          btn(LucideIcons.minus, () => delta(-1)),
          Expanded(
            child: Column(
              children: [
                Text('$_maxMembers',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 2),
                Text(_maxMembers == 11 ? 'STANDARD' : 'CUSTOM',
                    style: TextStyle(
                        color: _maxMembers == 11
                            ? ScoringTheme.theme
                            : ScoringTheme.accentSky,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5)),
              ],
            ),
          ),
          btn(LucideIcons.plus, () => delta(1)),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) {
    final months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ];
    final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
    final m = d.minute.toString().padLeft(2, '0');
    final p = d.hour >= 12 ? 'PM' : 'AM';
    return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year} • $h:$m $p';
  }

  // ── Step 2: Teams ──────────────────────────────────────────────────────────

  Widget _stepTeams() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _teamSlot(
          isA: true,
          picked: _teamAPicked,
          nameCtrl: _teamA,
        ),
        const SizedBox(height: 16),
        _teamSlot(
          isA: false,
          picked: _teamBPicked,
          nameCtrl: _teamB,
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ScoringTheme.accentSky.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: ScoringTheme.accentSky.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.info,
                  color: ScoringTheme.accentSky, size: 16),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Pick a team from your library to prefill the roster, or type a name to play with a custom XI.',
                  style: TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _teamSlot({
    required bool isA,
    required TeamModel? picked,
    required TextEditingController nameCtrl,
  }) {
    final letter = isA ? 'A' : 'B';
    final color = isA ? ScoringTheme.accentSky : ScoringTheme.tossPrimary;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(letter,
                    style: TextStyle(
                        color: color,
                        fontSize: 13,
                        fontWeight: FontWeight.w900)),
              ),
              const SizedBox(width: 10),
              Text('TEAM $letter',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.4)),
              const Spacer(),
              if (picked != null)
                GestureDetector(
                  onTap: () => setState(() {
                    if (isA) {
                      _teamAPicked = null;
                      _teamA.text = 'Team A';
                    } else {
                      _teamBPicked = null;
                      _teamB.text = 'Team B';
                    }
                  }),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(LucideIcons.x, color: Colors.white38, size: 14),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (picked != null) ...[
            _pickedTeamChip(picked, color),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _openTeamPicker(isA: isA),
              child: _pickerActionButton(LucideIcons.repeat, 'CHANGE TEAM'),
            ),
          ] else ...[
            _textField(nameCtrl, hint: 'e.g. Royals'),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _openTeamPicker(isA: isA),
              child:
                  _pickerActionButton(LucideIcons.users, 'PICK FROM LIBRARY'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _pickedTeamChip(TeamModel t, Color accent) {
    final initials = t.name.isEmpty
        ? '?'
        : t.name
            .trim()
            .split(RegExp(r'\s+'))
            .take(2)
            .map((p) => p[0].toUpperCase())
            .join();
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: accent.withValues(alpha: 0.3)),
          ),
          child: Text(initials,
              style: TextStyle(
                  color: accent, fontSize: 13, fontWeight: FontWeight.w900)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(t.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text(
                '${t.sportType.toUpperCase()} · CODE ${t.teamCode} · ${t.members.length + t.customMembers.length} MEMBERS',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pickerActionButton(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: ScoringTheme.theme, size: 13),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(
                  color: ScoringTheme.theme,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
        ],
      ),
    );
  }

  Future<void> _openTeamPicker({required bool isA}) async {
    // Kick off fetches once; the sheet reads from cached lists.
    _ensureTeamsLoaded();
    final TeamModel? selected = await showModalBottomSheet<TeamModel?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _TeamPickerSheet(
        myTeamsFuture: () => _myTeams,
        opponentTeamsFuture: () => _opponentTeams,
        loading: () => _loadingTeams,
      ),
    );
    if (selected == null || !mounted) return;

    final squad = _extractRoster(selected);
    // If the squad has more members than the chosen players-per-side, force
    // the user to trim it down to exactly _maxMembers via the squad picker.
    // Squads at or below the limit just get loaded as-is and the user can
    // top them up via the existing "ADD PLAYERS" flow.
    List<PickedPlayer> playingXI = squad;
    if (squad.length > _maxMembers) {
      final picked = await _openSquadPicker(
        teamName: selected.name,
        squad: squad,
      );
      if (picked == null) {
        // User backed out of the picker — don't overwrite the existing XI.
        return;
      }
      playingXI = picked;
    }

    if (!mounted) return;
    setState(() {
      if (isA) {
        _teamAPicked = selected;
        _teamA.text = selected.name;
        _teamAPlayers
          ..clear()
          ..addAll(playingXI);
      } else {
        _teamBPicked = selected;
        _teamB.text = selected.name;
        _teamBPlayers
          ..clear()
          ..addAll(playingXI);
      }
    });
  }

  Future<List<PickedPlayer>?> _openSquadPicker({
    required String teamName,
    required List<PickedPlayer> squad,
  }) async {
    return showModalBottomSheet<List<PickedPlayer>?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _SquadPickerSheet(
        teamName: teamName,
        squad: squad,
        targetCount: _maxMembers,
      ),
    );
  }

  Future<void> _ensureTeamsLoaded() async {
    if (_loadingTeams || _myTeams != null) return;
    setState(() => _loadingTeams = true);
    try {
      final my = await TeamService().getMyTeams();
      final all = await TeamService().getAllPublicTeams();
      if (!mounted) return;
      setState(() {
        _myTeams = my;
        // Filter out the user's own teams from the opponents tab.
        final myIds = my.map((t) => t.id).toSet();
        _opponentTeams = all.where((t) => !myIds.contains(t.id)).toList();
        _loadingTeams = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _myTeams = const [];
        _opponentTeams = const [];
        _loadingTeams = false;
      });
    }
  }

  List<PickedPlayer> _extractRoster(TeamModel t) {
    final out = <PickedPlayer>[];
    for (final m in t.members) {
      out.add((
        name: m.userName ?? 'Player',
        role: m.role == TeamRole.captain
            ? 'CAPTAIN'
            : m.role == TeamRole.viceCaptain
                ? 'VICE_CAPTAIN'
                : 'BATSMAN',
        id: m.userId,
        isCustom: false,
        phone: null,
        avatar: m.avatarUrl,
      ));
    }
    for (final c in t.customMembers) {
      out.add((
        name: c.name,
        role: 'BATSMAN',
        id: null,
        isCustom: true,
        phone: c.phone,
        avatar: null,
      ));
    }
    return out;
  }

  // ── Step 3: Playing XIs ────────────────────────────────────────────────────

  Widget _stepXIs() {
    return Column(
      children: [
        _teamRoster(
          'TEAM A — ${_teamA.text.trim()}',
          _teamAPlayers,
          otherTeam: _teamBPlayers,
          onAddMany: (ps) => setState(() => _teamAPlayers.addAll(ps)),
          onRemove: (i) => setState(() => _teamAPlayers.removeAt(i)),
          onReplace: (i, p) => setState(() => _teamAPlayers[i] = p),
        ),
        const SizedBox(height: 20),
        _teamRoster(
          'TEAM B — ${_teamB.text.trim()}',
          _teamBPlayers,
          otherTeam: _teamAPlayers,
          onAddMany: (ps) => setState(() => _teamBPlayers.addAll(ps)),
          onRemove: (i) => setState(() => _teamBPlayers.removeAt(i)),
          onReplace: (i, p) => setState(() => _teamBPlayers[i] = p),
        ),
      ],
    );
  }

  Widget _teamRoster(
    String title,
    List<PickedPlayer> players, {
    required List<PickedPlayer> otherTeam,
    required void Function(List<PickedPlayer> players) onAddMany,
    required void Function(int index) onRemove,
    required void Function(int index, PickedPlayer player) onReplace,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5)),
              ),
              Builder(builder: (_) {
                final n = players.length;
                final ok = n == _maxMembers;
                final over = n > _maxMembers;
                final color = ok
                    ? ScoringTheme.theme
                    : (over ? const Color(0xFFFCA5A5) : ScoringTheme.accentSky);
                return Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withValues(alpha: 0.4)),
                  ),
                  child: Text('$n / $_maxMembers',
                      style: TextStyle(
                          color: color,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5)),
                );
              }),
            ],
          ),
          const SizedBox(height: 6),
          Builder(builder: (_) {
            final n = players.length;
            if (n == _maxMembers) {
              return _statusLine('PLAYING XI READY', ScoringTheme.theme);
            }
            if (n > _maxMembers) {
              return _statusLine(
                  'REMOVE ${n - _maxMembers} PLAYER${n - _maxMembers == 1 ? '' : 'S'}',
                  const Color(0xFFFCA5A5));
            }
            return _statusLine(
                'NEED ${_maxMembers - n} MORE PLAYER${_maxMembers - n == 1 ? '' : 'S'}',
                ScoringTheme.accentSky);
          }),
          const SizedBox(height: 12),
          if (players.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('NO PLAYERS ADDED YET',
                  style: TextStyle(
                      color: Colors.white38,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            )
          else
            ...players.asMap().entries.map((e) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: ScoringTheme.theme.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                            e.value.name.isEmpty
                                ? '?'
                                : e.value.name[0].toUpperCase(),
                            style: const TextStyle(
                                color: ScoringTheme.theme,
                                fontSize: 13,
                                fontWeight: FontWeight.w900)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.value.name,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Text(e.value.role.toUpperCase(),
                                style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.5)),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Replace player',
                        onPressed: () => _showAddPlayerSheet(
                          onAddMany: (ps) {
                            if (ps.isNotEmpty) {
                              onReplace(e.key, ps.first);
                            }
                          },
                          replaceExisting: e.value,
                          // Block picking anyone already on EITHER team —
                          // the one slot being replaced is fair game, but
                          // the rest of this team + every player on the
                          // opposing team are locked in.
                          alreadyPickedPlayers: [
                            for (final p in players)
                              if (!identical(p, e.value)) p,
                            ...otherTeam,
                          ],
                          remainingSlots: 1,
                        ),
                        icon: const Icon(LucideIcons.refreshCw,
                            color: Colors.white38, size: 14),
                      ),
                      IconButton(
                        tooltip: 'Remove player',
                        onPressed: () => onRemove(e.key),
                        icon: const Icon(LucideIcons.x,
                            color: Colors.white38, size: 14),
                      ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 8),
          Builder(builder: (_) {
            final remaining = (_maxMembers - players.length).clamp(0, 999);
            final full = remaining == 0;
            return GestureDetector(
              onTap: full
                  ? null
                  : () => _showAddPlayerSheet(
                        onAddMany: onAddMany,
                        // Filter against every player already on this team
                        // and on the opposing team so the same person can't
                        // end up in both XIs.
                        alreadyPickedPlayers: [
                          ...players,
                          ...otherTeam,
                        ],
                        remainingSlots: remaining,
                      ),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: full ? 0.01 : 0.03),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: full ? 0.05 : 0.1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.plus,
                        color: full ? Colors.white24 : ScoringTheme.theme,
                        size: 14),
                    const SizedBox(width: 6),
                    Text(
                      full
                          ? 'TEAM FULL (${_maxMembers})'
                          : 'ADD PLAYERS  •  $remaining LEFT',
                      style: TextStyle(
                          color: full ? Colors.white24 : ScoringTheme.theme,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.4),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _statusLine(String text, Color color) {
    return Row(
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(text,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.6,
            )),
      ],
    );
  }

  Future<void> _showAddPlayerSheet({
    required void Function(List<PickedPlayer> players) onAddMany,
    required List<PickedPlayer> alreadyPickedPlayers,
    required int remainingSlots,
    PickedPlayer? replaceExisting,
  }) async {
    final existingIds = <String>{};
    final existingNames = <String>{};
    final existingPhones = <String>{};
    for (final p in alreadyPickedPlayers) {
      if (p.id != null && p.id!.isNotEmpty) existingIds.add(p.id!);
      final n = p.name.trim().toLowerCase();
      if (n.isNotEmpty) existingNames.add(n);
      final ph = (p.phone ?? '').replaceAll(RegExp(r'\s+'), '');
      if (ph.isNotEmpty) existingPhones.add(ph);
    }
    final result = await showModalBottomSheet<List<PickedPlayer>?>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _AddPlayerSheet(
        replacing: replaceExisting,
        existingIds: existingIds,
        existingNames: existingNames,
        existingPhones: existingPhones,
        remainingSlots: remainingSlots,
      ),
    );
    if (result != null && result.isNotEmpty) onAddMany(result);
  }

  InputDecoration _inputDecoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.03),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(
                color: ScoringTheme.accentSky.withValues(alpha: 0.5))),
      );

  // ── Step 4: Scoring Password (mandatory) ──────────────────────────────────
  //
  // Dedicated step so the host can't skip it. The scorer enters this
  // password on the review screen to unlock the live scorer (it's exchanged
  // for an 8h scorer JWT via /scoring/auth/:gameId). Two fields with a
  // match check — a typo here would lock the scorer out of their own match.

  Widget _stepScoringPassword() {
    final p = _scoringPassword.text;
    final c = _scoringPasswordConfirm.text;
    final tooShort = p.isNotEmpty && p.length < _kMinScoringPasswordLength;
    final mismatch = c.isNotEmpty && p != c;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ScoringTheme.accentSky.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: ScoringTheme.accentSky.withValues(alpha: 0.2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(LucideIcons.shieldAlert,
                  color: ScoringTheme.accentSky, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: RichText(
                  text: const TextSpan(
                    style: TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      height: 1.5,
                    ),
                    children: [
                      TextSpan(
                        text: 'Scoring password is required.\n',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      TextSpan(
                        text:
                            'You will enter this password on the review screen to start the match. Anyone scoring on your behalf will need it too.',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _label('Scoring Password'),
        _scoringPasswordField(
          _scoringPassword,
          hint: 'At least $_kMinScoringPasswordLength characters',
          autofocus: true,
        ),
        if (tooShort) ...[
          const SizedBox(height: 6),
          Text(
            'Use at least $_kMinScoringPasswordLength characters.',
            style: const TextStyle(
              color: Color(0xFFFCA5A5),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
        const SizedBox(height: 16),
        _label('Confirm Password'),
        _scoringPasswordField(
          _scoringPasswordConfirm,
          hint: 'Re-enter the password',
        ),
        if (mismatch) ...[
          const SizedBox(height: 6),
          const Text(
            "Passwords don't match.",
            style: TextStyle(
              color: Color(0xFFFCA5A5),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            GestureDetector(
              onTap: () =>
                  setState(() => _passwordObscured = !_passwordObscured),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.04),
                  borderRadius: BorderRadius.circular(6),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _passwordObscured ? LucideIcons.eye : LucideIcons.eyeOff,
                      size: 13,
                      color: Colors.white70,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _passwordObscured ? 'SHOW' : 'HIDE',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _scoringPasswordField(
    TextEditingController c, {
    required String hint,
    bool autofocus = false,
  }) {
    return TextField(
      controller: c,
      autofocus: autofocus,
      obscureText: _passwordObscured,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
      ),
      decoration: _inputDecoration(hint),
      onChanged: (_) => setState(() {}),
    );
  }

  // ── Step 5: Add-ons ────────────────────────────────────────────────────────
  //
  // Restructured from one long scroll into 4 inner tabs: VENUE / PROS /
  // STREAMING / RULES. Each tab keeps step 5 short enough to fit on a phone
  // screen without scroll, and matches the web's `addonsTab` UX so the
  // information architecture is the same across platforms.

  static const _addonsTabs = ['VENUE', 'PROS', 'STREAMING'];

  Widget _stepAddons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _TabBarStrip(
            tabs: _addonsTabs,
            active: _addonsTab,
            onSelect: (i) => setState(() => _addonsTab = i),
          ),
        ),
        switch (_addonsTab) {
          0 => _addonsVenueTab(),
          1 => _addonsProsTab(),
          _ => _addonsStreamingTab(),
        },
      ],
    );
  }

  Widget _addonsVenueTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('Venue'),
        _venueRow(),
      ],
    );
  }

  Widget _addonsProsTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('Umpire (optional)'),
        _umpireRow(),
        const SizedBox(height: 16),
        _label('Scorer (optional)'),
        _textField(_scorer, hint: 'Name of the scorer'),
        const SizedBox(height: 16),
        _label('Streamer (optional)'),
        _textField(_streamer, hint: 'Person handling the live stream'),
      ],
    );
  }

  Widget _addonsStreamingTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label('YouTube Live URL (optional)'),
        _textField(_youtubeUrl, hint: 'https://www.youtube.com/live/...'),
        const SizedBox(height: 12),
        // Scoring password lives on its own step (step 4) now — keep a note
        // here so a scorer hunting in the old place isn't confused.
        Text(
          'Scoring password is set on Step 4 (Scoring Password).',
          style: TextStyle(
              color: Colors.white.withValues(alpha: 0.4),
              fontSize: 11,
              fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  // ── Step 6: House Rules ───────────────────────────────────────────────────
  // Merges the old Add-ons RULES sub-tab (powerplay overs) with the in-match
  // house-rules sheet (free hit, consecutive over, penalty, wide/no-ball as
  // legal, last man stands, balls/over, players/team, max runs/ball). Now
  // set at creation time so the umpire doesn't have to dig for it once the
  // match is live.

  Widget _stepHouseRules() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ScoringTheme.accentSky.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: ScoringTheme.accentSky.withValues(alpha: 0.2)),
          ),
          child: const Row(
            children: [
              Icon(LucideIcons.bookOpen,
                  color: ScoringTheme.accentSky, size: 16),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Set the rules now to lock them in before the toss. Toggles left at "MCC default" stay MCC. Umpire can still override mid-match from the live scorer.',
                  style: TextStyle(
                    color: Color(0xFFCBD5E1),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _label('Powerplay Overs'),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: _powerPlayOvers.toDouble(),
                min: 0,
                max: 20,
                divisions: 20,
                activeColor: ScoringTheme.theme,
                inactiveColor: Colors.white24,
                onChanged: (v) => setState(() => _powerPlayOvers = v.round()),
              ),
            ),
            SizedBox(
              width: 60,
              child: Text('$_powerPlayOvers',
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _hrSectionTitle('LAWS'),
        _hrToggle(
          label: 'Enforce Free Hit after no-ball',
          hint: "When off, no-balls don't trigger a free hit.",
          value: _enforceFreeHit,
          onChanged: (v) => setState(() => _enforceFreeHit = v),
        ),
        _hrToggle(
          label: 'Block consecutive overs by same bowler',
          hint: 'Stops a bowler bowling two overs in a row.',
          value: _enforceConsecutiveOverBlock,
          onChanged: (v) => setState(() => _enforceConsecutiveOverBlock = v),
        ),
        _hrToggle(
          label: 'Penalty runs enabled',
          hint: 'Required for time-wasting / ball-tampering deductions.',
          value: _penaltyEnabled,
          onChanged: (v) => setState(() => _penaltyEnabled = v),
        ),
        _hrToggle(
          label: 'Wide counts as a legal ball',
          hint: 'When on, wides do not need to be re-bowled.',
          value: _wideIsLegalBall,
          onChanged: (v) => setState(() => _wideIsLegalBall = v),
        ),
        _hrToggle(
          label: 'No-ball counts as a legal ball',
          hint: 'When on, no-balls do not need to be re-bowled.',
          value: _noBallIsLegalBall,
          onChanged: (v) => setState(() => _noBallIsLegalBall = v),
        ),
        _hrToggle(
          label: 'Last man stands',
          hint: 'Skip all-out — the last batter bats alone.',
          value: _lastManStands,
          onChanged: (v) => setState(() => _lastManStands = v),
        ),
        const SizedBox(height: 14),
        _hrSectionTitle('LIMITS'),
        _hrIntField(
          label: 'Balls per over',
          range: '1..12',
          controller: _ballsPerOverCtrl,
          min: 1,
          max: 12,
        ),
        _hrIntField(
          label: 'Players per team',
          range: '2..30',
          controller: _playersPerTeamCtrl,
          min: 2,
          max: 30,
        ),
        _hrIntField(
          label: 'Max runs per ball',
          range: '1..12',
          controller: _maxRunsPerBallCtrl,
          min: 1,
          max: 12,
        ),
        if (!_houseRulesValid) ...[
          const SizedBox(height: 8),
          const Text(
            'One or more limit values are out of range.',
            style: TextStyle(
              color: Color(0xFFFCA5A5),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ],
    );
  }

  Widget _hrSectionTitle(String text) => Padding(
        padding: const EdgeInsets.fromLTRB(0, 12, 0, 6),
        child: Text(
          text,
          style: const TextStyle(
            color: ScoringTheme.theme,
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
          ),
        ),
      );

  Widget _hrToggle({
    required String label,
    required String hint,
    required bool? value,
    required ValueChanged<bool?> onChanged,
  }) {
    final overridden = value != null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  hint,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (!overridden)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      'MCC default',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.35),
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Switch(
            value: value ?? false,
            activeThumbColor: ScoringTheme.theme,
            onChanged: (v) => onChanged(v),
          ),
          IconButton(
            tooltip: 'Reset to MCC',
            icon: Icon(
              Icons.refresh,
              size: 18,
              color: overridden
                  ? Colors.white70
                  : Colors.white.withValues(alpha: 0.25),
            ),
            onPressed: overridden ? () => onChanged(null) : null,
          ),
        ],
      ),
    );
  }

  Widget _hrIntField({
    required String label,
    required String range,
    required TextEditingController controller,
    required int min,
    required int max,
  }) {
    final raw = controller.text.trim();
    final parsed = int.tryParse(raw);
    final invalid =
        raw.isNotEmpty && (parsed == null || parsed < min || parsed > max);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Range $range  •  blank = MCC',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 88,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                isDense: true,
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.06),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(
                      color: invalid
                          ? const Color(0xFFEF4444)
                          : Colors.transparent),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(
                      color: invalid
                          ? const Color(0xFFEF4444)
                          : Colors.transparent),
                ),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
        ],
      ),
    );
  }

  /// True when every int field is either blank (use MCC) or parses to an
  /// int within its allowed range. Toggles are always valid (tri-state).
  bool get _houseRulesValid {
    bool ok(TextEditingController c, int lo, int hi) {
      final raw = c.text.trim();
      if (raw.isEmpty) return true;
      final n = int.tryParse(raw);
      return n != null && n >= lo && n <= hi;
    }

    return ok(_ballsPerOverCtrl, 1, 12) &&
        ok(_playersPerTeamCtrl, 2, 30) &&
        ok(_maxRunsPerBallCtrl, 1, 12);
  }

  /// Build the `houseRules` payload — only includes keys the user actually
  /// touched, matching the in-match sheet's "null = MCC default" convention.
  Map<String, dynamic> _collectHouseRules() {
    final m = <String, dynamic>{};
    if (_enforceFreeHit != null) m['enforceFreeHit'] = _enforceFreeHit;
    if (_enforceConsecutiveOverBlock != null) {
      m['enforceConsecutiveOverBlock'] = _enforceConsecutiveOverBlock;
    }
    if (_penaltyEnabled != null) m['penaltyEnabled'] = _penaltyEnabled;
    if (_wideIsLegalBall != null) m['wideIsLegalBall'] = _wideIsLegalBall;
    if (_noBallIsLegalBall != null) {
      m['noBallIsLegalBall'] = _noBallIsLegalBall;
    }
    if (_lastManStands != null) m['lastManStands'] = _lastManStands;
    final bpo = int.tryParse(_ballsPerOverCtrl.text.trim());
    if (bpo != null) m['ballsPerOver'] = bpo;
    final ppt = int.tryParse(_playersPerTeamCtrl.text.trim());
    if (ppt != null) m['playersPerTeam'] = ppt;
    final mrpb = int.tryParse(_maxRunsPerBallCtrl.text.trim());
    if (mrpb != null) m['maxRunsPerBall'] = mrpb;
    return m;
  }

  Widget _venueRow() {
    // "Picked" means either a grounds-list selection OR a custom-venue entry
    // — both should render as a confirmed chip with an X to clear.
    final hasPicked = _venueId != null || _customVenueLat != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (hasPicked)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: ScoringTheme.accentSky.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: ScoringTheme.accentSky.withValues(alpha: 0.25)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.mapPin,
                    color: ScoringTheme.accentSky, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(_venue.text.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w800)),
                ),
                GestureDetector(
                  onTap: () => setState(() {
                    _venueId = null;
                    _venue.clear();
                    _customVenueLat = null;
                    _customVenueLng = null;
                  }),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(LucideIcons.x, color: Colors.white38, size: 14),
                  ),
                ),
              ],
            ),
          )
        else
          _textField(_venue, hint: 'e.g. National Arena, Dubai'),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: _openGroundsPicker,
                child: _pickerActionButton(LucideIcons.mapPin, 'PICK A GROUND'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: GestureDetector(
                onTap: _openCustomVenue,
                child: _pickerActionButton(
                    LucideIcons.plusCircle, 'ADD CUSTOM VENUE'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _umpireRow() {
    final hasPicked = _umpireId != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (hasPicked)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: ScoringTheme.tossPrimary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: ScoringTheme.tossPrimary.withValues(alpha: 0.25)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.userCheck,
                    color: ScoringTheme.tossPrimary, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(_umpire.text.trim(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w800)),
                ),
                GestureDetector(
                  onTap: () => setState(() {
                    _umpireId = null;
                    _umpire.clear();
                  }),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(LucideIcons.x, color: Colors.white38, size: 14),
                  ),
                ),
              ],
            ),
          )
        else
          _textField(_umpire, hint: 'Name of the on-field umpire'),
        const SizedBox(height: 10),
        GestureDetector(
          onTap: _openUmpirePicker,
          child: _pickerActionButton(LucideIcons.userCheck, 'PICK AN UMPIRE'),
        ),
      ],
    );
  }

  Future<void> _openGroundsPicker() async {
    _ensureGroundsLoaded();
    final TurfModel? selected = await showModalBottomSheet<TurfModel?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _GroundPickerSheet(
        groundsFuture: () => _venueOptions,
        loading: () => _loadingGrounds,
      ),
    );
    if (selected == null || !mounted) return;
    setState(() {
      _venueId = selected.id;
      _venue.text = [selected.name, selected.location]
          .where((s) => s.isNotEmpty)
          .join(' · ');
    });
  }

  Future<void> _ensureGroundsLoaded() async {
    if (_loadingGrounds || _venueOptions != null) return;
    setState(() => _loadingGrounds = true);
    try {
      final list = await TurfService().getAllTurfs();
      if (!mounted) return;
      setState(() {
        _venueOptions = list;
        _loadingGrounds = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _venueOptions = <TurfModel>[];
        _loadingGrounds = false;
      });
    }
  }

  Future<void> _openUmpirePicker() async {
    // The sheet manages its own per-role cache now, so the parent no longer
    // needs to prefetch. Empty id on the result = custom official entered by
    // the scorer in-sheet (no backend record to link to).
    final OfficialModel? selected = await showModalBottomSheet<OfficialModel?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _UmpirePickerSheet(),
    );
    if (selected == null || !mounted) return;
    setState(() {
      _umpireId = selected.id.isEmpty ? null : selected.id;
      _umpire.text = selected.name;
    });
  }

  Future<void> _openCustomVenue() async {
    final result = await showModalBottomSheet<_CustomVenueResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CustomVenueSheet(
        initialName: _venueId == null ? _venue.text.trim() : '',
      ),
    );
    if (result == null || !mounted) return;
    setState(() {
      // A custom venue is the inverse of a grounds-list pick — clear the
      // venueId so the backend won't try to link to a missing ground record.
      _venueId = null;
      _venue.text = result.label;
      _customVenueLat = result.lat;
      _customVenueLng = result.lng;
    });
  }

  // ── Step 6: Review ─────────────────────────────────────────────────────────

  Widget _stepReview() {
    final r = _result();
    final hasOfficials =
        r.umpireName != null || r.scorerName != null || r.streamerName != null;
    final hasStreaming = r.youtubeLiveUrl != null || r.scoringPassword != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _reviewBlock('MATCH', [
          _kv('Name', r.matchName),
          _kv('Format', '${r.format} • ${r.overs} overs'),
          _kv('Powerplay', '${r.powerPlayOvers} overs'),
          _kv('Ball', r.ballType),
          _kv('Ground', r.groundType),
          _kv('Timing', r.timing),
          _kv('Pitch', r.pitchType),
          if (r.matchDate != null) _kv('Scheduled', _formatDate(r.matchDate!)),
          if (r.venueName.isNotEmpty) _kv('Venue', r.venueName),
        ]),
        const SizedBox(height: 16),
        _reviewBlock('TEAMS', [
          _kv('Team A', '${r.teamAName} (${r.teamAPlayers.length})'),
          _kv('Team B', '${r.teamBName} (${r.teamBPlayers.length})'),
        ]),
        if (hasOfficials) ...[
          const SizedBox(height: 16),
          _reviewBlock('OFFICIALS', [
            if (r.umpireName != null) _kv('Umpire', r.umpireName!),
            if (r.scorerName != null) _kv('Scorer', r.scorerName!),
            if (r.streamerName != null) _kv('Streamer', r.streamerName!),
          ]),
        ],
        if (hasStreaming) ...[
          const SizedBox(height: 16),
          _reviewBlock('STREAMING & ACCESS', [
            if (r.youtubeLiveUrl != null) _kv('YouTube', r.youtubeLiveUrl!),
            if (r.scoringPassword != null) _kv('Password', '••••••'),
          ]),
        ],
        const SizedBox(height: 16),
        _houseRulesReviewBlock(r),
        const SizedBox(height: 16),
        _tossPresetBlock(r),
      ],
    );
  }

  Widget _houseRulesReviewBlock(StartScoringResult r) {
    final rules = r.houseRules;
    final entries = <Widget>[];
    String fmtBool(dynamic v) => v == true ? 'On' : 'Off';
    if (rules.containsKey('enforceFreeHit')) {
      entries.add(_kv('Free hit', fmtBool(rules['enforceFreeHit'])));
    }
    if (rules.containsKey('enforceConsecutiveOverBlock')) {
      entries.add(_kv(
          'Consec. over block', fmtBool(rules['enforceConsecutiveOverBlock'])));
    }
    if (rules.containsKey('penaltyEnabled')) {
      entries.add(_kv('Penalties', fmtBool(rules['penaltyEnabled'])));
    }
    if (rules.containsKey('wideIsLegalBall')) {
      entries.add(_kv('Wide legal', fmtBool(rules['wideIsLegalBall'])));
    }
    if (rules.containsKey('noBallIsLegalBall')) {
      entries.add(_kv('No-ball legal', fmtBool(rules['noBallIsLegalBall'])));
    }
    if (rules.containsKey('lastManStands')) {
      entries.add(_kv('Last man stands', fmtBool(rules['lastManStands'])));
    }
    if (rules.containsKey('ballsPerOver')) {
      entries.add(_kv('Balls/over', '${rules['ballsPerOver']}'));
    }
    if (rules.containsKey('playersPerTeam')) {
      entries.add(_kv('Players/team', '${rules['playersPerTeam']}'));
    }
    if (rules.containsKey('maxRunsPerBall')) {
      entries.add(_kv('Max runs/ball', '${rules['maxRunsPerBall']}'));
    }
    entries.insert(0, _kv('Powerplay', '${r.powerPlayOvers} overs'));
    if (entries.length == 1) {
      entries.add(const Padding(
        padding: EdgeInsets.only(top: 4),
        child: Text(
          'All other rules: MCC default',
          style: TextStyle(
            color: Colors.white38,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ));
    }
    return _reviewBlock('HOUSE RULES', entries);
  }

  /// Pre-set toss selector on the review step. Skipping leaves the toss to be
  /// decided in the live TossModal after the coin flip (still the default
  /// path); pre-setting saves the scorer that extra step when the toss has
  /// already happened off-screen.
  Widget _tossPresetBlock(StartScoringResult r) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('TOSS (OPTIONAL)',
              style: TextStyle(
                  color: ScoringTheme.theme,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 4),
          const Text(
            'Skip to decide after the coin flip in the live screen.',
            style: TextStyle(
                color: Colors.white54,
                fontSize: 11,
                fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                  child: _tossPresetChip('TEAM A WON', 'teamA', r.teamAName)),
              const SizedBox(width: 8),
              Expanded(
                  child: _tossPresetChip('TEAM B WON', 'teamB', r.teamBName)),
              const SizedBox(width: 8),
              Expanded(child: _tossPresetChip('DECIDE LATER', null, null)),
            ],
          ),
          if (_tossWinner != null) ...[
            const SizedBox(height: 14),
            const Text('DECISION',
                style: TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _tossDecisionChip('BAT', 'BAT')),
                const SizedBox(width: 8),
                Expanded(child: _tossDecisionChip('BOWL', 'BOWL')),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _tossPresetChip(String label, String? winner, String? teamName) {
    final sel = _tossWinner == winner;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _tossWinner = winner);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: sel
              ? ScoringTheme.tossPrimary.withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: sel
                  ? ScoringTheme.tossPrimary.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.08)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: TextStyle(
                    color: sel ? Colors.white : Colors.white70,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2)),
            if (teamName != null && teamName.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                teamName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: sel ? ScoringTheme.tossPrimary : Colors.white38,
                    fontSize: 9,
                    fontWeight: FontWeight.w800),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _tossDecisionChip(String label, String value) {
    final sel = _tossDecision == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _tossDecision = value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: sel
              ? ScoringTheme.accentSky.withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: sel
                  ? ScoringTheme.accentSky.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.08)),
        ),
        child: Text(label,
            style: TextStyle(
                color: sel ? Colors.white : Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.6)),
      ),
    );
  }

  Widget _reviewBlock(String title, List<Widget> rows) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: ScoringTheme.theme,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.4)),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(k.toUpperCase(),
                style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5)),
          ),
          Expanded(
            child: Text(v,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  // ── Shared form bits ───────────────────────────────────────────────────────

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text.toUpperCase(),
            style: const TextStyle(
                color: Colors.white54,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.4)),
      );

  Widget _textField(TextEditingController c, {required String hint}) {
    return TextField(
      controller: c,
      style: const TextStyle(
          color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
      decoration: _inputDecoration(hint),
      onChanged: (_) => setState(() {}),
    );
  }

  Widget _grid<T>({
    required List<T> values,
    required List<String> labels,
    required T selected,
    required void Function(T) onSelect,
    required int crossAxisCount,
    required double aspectRatio,
  }) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: crossAxisCount,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: aspectRatio,
      children: List.generate(values.length, (i) {
        final v = values[i];
        final sel = v == selected;
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            onSelect(v);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: sel
                  ? ScoringTheme.accentSky.withValues(alpha: 0.1)
                  : Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                  color: sel
                      ? ScoringTheme.accentSky.withValues(alpha: 0.4)
                      : Colors.white.withValues(alpha: 0.08)),
            ),
            child: Text(labels[i],
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: sel ? Colors.white : Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5)),
          ),
        );
      }),
    );
  }

  Widget _bottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: BoxDecoration(
        border: Border(
            top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 52,
              child: OutlinedButton(
                onPressed: _back,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white54,
                  backgroundColor: Colors.white.withValues(alpha: 0.05),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(_step == 1 ? 'CANCEL' : 'BACK',
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _canAdvance ? _next : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: ScoringTheme.theme,
                  foregroundColor: Colors.black,
                  disabledBackgroundColor: Colors.white.withValues(alpha: 0.1),
                  disabledForegroundColor: Colors.white.withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(_step == 7 ? 'START MATCH' : 'NEXT',
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.4)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Picker sheets
// ─────────────────────────────────────────────────────────────────────────────

const _sheetBg = Color(0xFF111111);

InputDecoration _sheetInputDecoration(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white24),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.03),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      prefixIcon:
          const Icon(LucideIcons.search, color: Colors.white38, size: 18),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide:
              BorderSide(color: ScoringTheme.accentSky.withValues(alpha: 0.5))),
    );

Widget _sheetHandle() => Center(
      child: Container(
        width: 36,
        height: 4,
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
            color: Colors.white24, borderRadius: BorderRadius.circular(2)),
      ),
    );

Widget _sheetHeader(String title) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
      child: Text(title.toUpperCase(),
          style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5)),
    );

class _TabBarStrip extends StatelessWidget {
  final List<String> tabs;
  final int active;
  final ValueChanged<int> onSelect;
  const _TabBarStrip(
      {required this.tabs, required this.active, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: List.generate(tabs.length, (i) {
          final sel = i == active;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onSelect(i);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 140),
                padding: const EdgeInsets.symmetric(vertical: 9),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: sel
                      ? ScoringTheme.accentSky.withValues(alpha: 0.12)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(tabs[i],
                    style: TextStyle(
                        color: sel ? Colors.white : Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8)),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ── Team picker ──────────────────────────────────────────────────────────────

class _TeamPickerSheet extends StatefulWidget {
  final List<TeamModel>? Function() myTeamsFuture;
  final List<TeamModel>? Function() opponentTeamsFuture;
  final bool Function() loading;

  const _TeamPickerSheet({
    required this.myTeamsFuture,
    required this.opponentTeamsFuture,
    required this.loading,
  });

  @override
  State<_TeamPickerSheet> createState() => _TeamPickerSheetState();
}

class _TeamPickerSheetState extends State<_TeamPickerSheet> {
  int _tab = 0;
  final _searchCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  TeamModel? _codeResult;
  bool _codeSearching = false;
  String? _codeError;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _lookupByCode() async {
    final c = _codeCtrl.text.trim();
    if (c.isEmpty) return;
    setState(() {
      _codeSearching = true;
      _codeError = null;
      _codeResult = null;
    });
    try {
      final t = await TeamService().findByCode(c);
      if (!mounted) return;
      setState(() {
        _codeResult = t;
        _codeSearching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _codeError = 'No team found for code "$c"';
        _codeSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.78;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Pick a team'),
          _TabBarStrip(
            tabs: const ['MY TEAMS', 'OPPONENTS', 'BY CODE'],
            active: _tab,
            onSelect: (i) => setState(() => _tab = i),
          ),
          Expanded(child: _body()),
        ],
      ),
    );
  }

  Widget _body() {
    if (_tab == 2) return _byCodeTab();
    final lists = [widget.myTeamsFuture(), widget.opponentTeamsFuture()];
    final list = lists[_tab];
    if (widget.loading() || list == null) {
      return const Center(
          child: CircularProgressIndicator(color: ScoringTheme.theme));
    }
    final q = _searchCtrl.text.trim().toLowerCase();
    final filtered = q.isEmpty
        ? list
        : list
            .where((t) =>
                t.name.toLowerCase().contains(q) ||
                t.teamCode.toLowerCase().contains(q))
            .toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: TextField(
            controller: _searchCtrl,
            style: const TextStyle(color: Colors.white),
            onChanged: (_) => setState(() {}),
            decoration: _sheetInputDecoration('Search teams'),
          ),
        ),
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text('NO TEAMS FOUND',
                      style: TextStyle(
                          color: Colors.white38,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => _teamRow(filtered[i]),
                ),
        ),
      ],
    );
  }

  Widget _byCodeTab() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _codeCtrl,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700),
            textCapitalization: TextCapitalization.characters,
            decoration: _sheetInputDecoration('Enter team code (e.g. RYL-23X)')
                .copyWith(
                    prefixIcon: const Icon(LucideIcons.hash,
                        color: Colors.white38, size: 18)),
            onSubmitted: (_) => _lookupByCode(),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 46,
            child: ElevatedButton(
              onPressed: _codeSearching ? null : _lookupByCode,
              style: ElevatedButton.styleFrom(
                backgroundColor: ScoringTheme.accentSky,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: _codeSearching
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.black))
                  : const Text('FIND TEAM',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
            ),
          ),
          const SizedBox(height: 16),
          if (_codeError != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
              ),
              child: Text(_codeError!,
                  style: const TextStyle(
                      color: Color(0xFFFCA5A5),
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
            ),
          if (_codeResult != null) _teamRow(_codeResult!),
        ],
      ),
    );
  }

  Widget _teamRow(TeamModel t) {
    final memberCount = t.members.length + t.customMembers.length;
    return GestureDetector(
      onTap: () => Navigator.pop(context, t),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: ScoringTheme.theme.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(t.name.isEmpty ? '?' : t.name[0].toUpperCase(),
                  style: const TextStyle(
                      color: ScoringTheme.theme,
                      fontSize: 14,
                      fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(
                      '${t.sportType.toUpperCase()} · CODE ${t.teamCode} · $memberCount MEMBERS',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight,
                color: Colors.white38, size: 16),
          ],
        ),
      ),
    );
  }
}

// ── Add Player sheet (Search + Custom) ───────────────────────────────────────

class _AddPlayerSheet extends StatefulWidget {
  /// When non-null, the sheet renders in "replace" mode — header reads
  /// REPLACE PLAYER, role defaults to the existing player's role, and the
  /// CTA button reads UPDATE instead of ADD. Replace mode is always
  /// single-select.
  final PickedPlayer? replacing;

  /// Backend ids of users already on either team — used to grey out / hide
  /// duplicate search results so the same player can't end up in both XIs.
  final Set<String> existingIds;
  final Set<String> existingNames; // lowercase, trimmed
  final Set<String> existingPhones; // whitespace-stripped
  final int remainingSlots;

  const _AddPlayerSheet({
    this.replacing,
    required this.existingIds,
    required this.existingNames,
    required this.existingPhones,
    required this.remainingSlots,
  });

  @override
  State<_AddPlayerSheet> createState() => _AddPlayerSheetState();
}

class _AddPlayerSheetState extends State<_AddPlayerSheet> {
  int _tab = 0;
  late String _role;

  // Search tab
  final _searchCtrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _results = [];
  bool _searching = false;
  // Multi-select buffer for the search tab. Keyed by backend id so the same
  // user can't be selected twice across different search results.
  final Map<String, PickedPlayer> _selectedSearch = {};

  // Custom tab
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  // ISO calling code for the custom-player phone (no leading +). Defaults to
  // India; the country picker (Phase 3a.2) overrides this from the wheel.
  String _countryCode = '91';

  @override
  void initState() {
    super.initState();
    // Seed role + name from the existing player when in replace mode so the
    // scorer can just confirm without retyping if the only change is the
    // person.
    _role = widget.replacing?.role ?? 'BATSMAN';
    _nameCtrl = TextEditingController(text: widget.replacing?.name ?? '');
    _phoneCtrl = TextEditingController(text: widget.replacing?.phone ?? '');
    // If the existing phone already has a country prefix, peel it off so the
    // picker shows the right flag and the input field shows just the digits.
    final existingPhone = widget.replacing?.phone ?? '';
    if (existingPhone.startsWith('+')) {
      final m = RegExp(r'^\+(\d{1,4})\s*(.*)').firstMatch(existingPhone);
      if (m != null) {
        _countryCode = m.group(1)!;
        _phoneCtrl.text = m.group(2)!.trim();
      }
    }
    if (widget.replacing != null && widget.replacing!.isCustom) {
      // Land directly on the Custom tab when editing a custom player.
      _tab = 1;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  bool get _isReplace => widget.replacing != null;

  void _onSearchChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      if (q.trim().isEmpty) {
        setState(() => _results = []);
        return;
      }
      setState(() => _searching = true);
      try {
        final list = await UserService().searchPlayers(q.trim());
        if (!mounted) return;
        setState(() {
          _results = list;
          _searching = false;
        });
      } catch (_) {
        if (!mounted) return;
        setState(() {
          _results = [];
          _searching = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final selectedCount = _selectedSearch.length;
    final canAddMore =
        _isReplace ? true : selectedCount < widget.remainingSlots;
    return Container(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader(_isReplace ? 'Replace player' : 'Add players'),
          if (!_isReplace) _slotHintBar(selectedCount, canAddMore),
          _TabBarStrip(
            tabs: const ['SEARCH', 'CUSTOM'],
            active: _tab,
            onSelect: (i) => setState(() => _tab = i),
          ),
          _roleStrip(),
          const SizedBox(height: 12),
          if (_tab == 0) _searchBody(canAddMore) else _customBody(),
          if (!_isReplace && _tab == 0 && selectedCount > 0)
            _bulkAddBar(selectedCount),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _slotHintBar(int selectedCount, bool canAddMore) {
    final remaining = widget.remainingSlots - selectedCount;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      child: Row(
        children: [
          const Icon(LucideIcons.users, color: Colors.white38, size: 14),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              canAddMore
                  ? 'Pick up to $remaining more.'
                  : 'Slot limit reached. Confirm or remove some to add more.',
              style: TextStyle(
                color: canAddMore ? Colors.white54 : const Color(0xFFFCA5A5),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bulkAddBar(int selectedCount) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
      child: SizedBox(
        height: 50,
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () =>
              Navigator.pop(context, _selectedSearch.values.toList()),
          style: ElevatedButton.styleFrom(
            backgroundColor: ScoringTheme.theme,
            foregroundColor: Colors.black,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: Text(
            selectedCount == 1 ? 'ADD 1 PLAYER' : 'ADD $selectedCount PLAYERS',
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2),
          ),
        ),
      ),
    );
  }

  Widget _roleStrip() {
    const roles = [
      'BATSMAN',
      'BOWLER',
      'ALL_ROUNDER',
      'WICKET_KEEPER',
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: roles.map((r) {
          final sel = _role == r;
          return GestureDetector(
            onTap: () => setState(() => _role = r),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: sel
                    ? ScoringTheme.theme
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(r.replaceAll('_', ' '),
                  style: TextStyle(
                      color: sel ? Colors.black : Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.4)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _searchBody(bool canAddMore) {
    // Drop results that are already on either team — they're locked in.
    final filtered = _results.where((u) {
      final id = (u['id'] ?? u['_id'] ?? '').toString();
      final name =
          (u['name'] ?? u['username'] ?? '').toString().trim().toLowerCase();
      if (id.isNotEmpty && widget.existingIds.contains(id)) return false;
      if (name.isNotEmpty && widget.existingNames.contains(name)) {
        return false;
      }
      return true;
    }).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _searchCtrl,
            autofocus: true,
            style: const TextStyle(color: Colors.white),
            onChanged: _onSearchChanged,
            decoration: _sheetInputDecoration('Search players by name'),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: _searching
                ? const Center(
                    child: CircularProgressIndicator(color: ScoringTheme.theme))
                : filtered.isEmpty
                    ? Center(
                        child: Text(
                          _results.isEmpty
                              ? _searchCtrlEmptyHint
                              : 'ALL MATCHES ALREADY PICKED',
                          style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5),
                        ),
                      )
                    : ListView.separated(
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final u = filtered[i];
                          final name = (u['name'] ?? u['username'] ?? 'Player')
                              .toString();
                          final username = (u['username'] ?? '').toString();
                          final id = (u['id'] ?? u['_id'] ?? '').toString();
                          final selected =
                              id.isNotEmpty && _selectedSearch.containsKey(id);
                          // Tappable when already selected (to deselect) OR
                          // when we still have slots and replace mode.
                          final tappable = _isReplace || selected || canAddMore;
                          return GestureDetector(
                            onTap: tappable
                                ? () => _onSearchRowTap(u, id, name)
                                : null,
                            child: Opacity(
                              opacity: tappable ? 1.0 : 0.4,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: selected
                                      ? ScoringTheme.theme
                                          .withValues(alpha: 0.14)
                                      : Colors.white.withValues(alpha: 0.03),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: selected
                                        ? ScoringTheme.theme
                                            .withValues(alpha: 0.5)
                                        : Colors.transparent,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 32,
                                      height: 32,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: ScoringTheme.accentSky
                                            .withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                          name.isEmpty
                                              ? '?'
                                              : name[0].toUpperCase(),
                                          style: const TextStyle(
                                              color: ScoringTheme.accentSky,
                                              fontWeight: FontWeight.w900)),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(name,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w800)),
                                          if (username.isNotEmpty)
                                            Text('@$username',
                                                style: const TextStyle(
                                                    color: Colors.white54,
                                                    fontSize: 10,
                                                    fontWeight:
                                                        FontWeight.w700)),
                                        ],
                                      ),
                                    ),
                                    _SelectDot(selected: selected),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
          ),
        ],
      ),
    );
  }

  void _onSearchRowTap(Map<String, dynamic> u, String id, String name) {
    final picked = (
      name: name,
      role: _role,
      id: id.isEmpty ? null : id,
      isCustom: false,
      phone: null,
      avatar: u['profilePicture']?.toString(),
    ) as PickedPlayer;
    // Replace mode + no-id fallback both behave as single-pick.
    if (widget.replacing != null || id.isEmpty) {
      Navigator.pop(context, [picked]);
      return;
    }
    setState(() {
      if (_selectedSearch.containsKey(id)) {
        _selectedSearch.remove(id);
      } else {
        _selectedSearch[id] = picked;
      }
    });
  }

  /// Opens the multi-select phone-book picker (same sheet used by the team
  /// invite flow) and converts the picked entries into custom PickedPlayers.
  /// Duplicates against either team's roster are dropped silently; if the
  /// resulting pick set is larger than the team's remaining slots we trim
  /// from the end so the wizard's slot invariant holds.
  Future<void> _pickFromContacts() async {
    final picked = await showModalBottomSheet<List<PickedContact>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ContactPickerSheet(),
    );
    if (!mounted || picked == null || picked.isEmpty) return;

    final added = <PickedPlayer>[];
    final seenNames = <String>{};
    final seenPhones = <String>{};
    for (final c in picked) {
      final n = c.name.trim();
      final phone = c.phone.trim();
      final lname = n.toLowerCase();
      final cleanPhone = phone.replaceAll(RegExp(r'\s+'), '');
      // Drop dupes vs already-picked roster, vs already-collected within
      // this single pick, and rows missing a usable name.
      if (n.isEmpty) continue;
      if (widget.existingNames.contains(lname) ||
          (cleanPhone.isNotEmpty &&
              widget.existingPhones.contains(cleanPhone))) {
        continue;
      }
      if (seenNames.contains(lname) ||
          (cleanPhone.isNotEmpty && seenPhones.contains(cleanPhone))) {
        continue;
      }
      seenNames.add(lname);
      if (cleanPhone.isNotEmpty) seenPhones.add(cleanPhone);
      added.add((
        name: n,
        role: _role,
        id: null,
        isCustom: true,
        phone: phone.isEmpty ? null : phone,
        avatar: null,
      ) as PickedPlayer);
    }
    // Respect the slot ceiling — silently drop the tail rather than over-fill.
    final capped = added.length > widget.remainingSlots
        ? added.sublist(0, widget.remainingSlots)
        : added;
    if (capped.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('All picked contacts are already on a team.')),
      );
      return;
    }
    if (!mounted) return;
    Navigator.pop(context, capped);
  }

  Widget _customBody() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!_isReplace) ...[
            SizedBox(
              height: 46,
              child: OutlinedButton.icon(
                onPressed: _pickFromContacts,
                icon: const Icon(LucideIcons.contact,
                    color: ScoringTheme.theme, size: 16),
                label: const Text(
                  'PICK FROM CONTACTS',
                  style: TextStyle(
                    color: ScoringTheme.theme,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.8,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                      color: ScoringTheme.theme.withValues(alpha: 0.5)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Expanded(child: Divider(color: Colors.white12)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    'OR ADD MANUALLY',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                const Expanded(child: Divider(color: Colors.white12)),
              ],
            ),
            const SizedBox(height: 10),
          ],
          TextField(
            controller: _nameCtrl,
            autofocus: _isReplace,
            style: const TextStyle(color: Colors.white),
            decoration: _sheetInputDecoration('Full name').copyWith(
                prefixIcon: const Icon(LucideIcons.user,
                    color: Colors.white38, size: 18)),
          ),
          const SizedBox(height: 10),
          // Phone row: country-code picker + national digits. The picker chip
          // opens a searchable wheel; the input field stays focused for the
          // common case where the scorer only wants to change the number.
          Row(
            children: [
              _CountryCodeChip(
                code: _countryCode,
                onTap: () async {
                  final picked = await showModalBottomSheet<String>(
                    context: context,
                    backgroundColor: Colors.transparent,
                    isScrollControlled: true,
                    builder: (_) =>
                        _CountryCodePickerSheet(active: _countryCode),
                  );
                  if (picked != null && mounted) {
                    setState(() => _countryCode = picked);
                  }
                },
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white),
                  decoration:
                      _sheetInputDecoration('Phone (optional)').copyWith(
                    prefixIcon: const Icon(LucideIcons.phone,
                        color: Colors.white38, size: 18),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: () {
                final n = _nameCtrl.text.trim();
                if (n.isEmpty) return;
                final digits = _phoneCtrl.text.trim();
                final fullPhone =
                    digits.isEmpty ? null : '+$_countryCode $digits';
                // Dedup against the existing roster — same name (or same
                // phone) on either team is already locked in.
                final lname = n.toLowerCase();
                final cleanPhone =
                    (fullPhone ?? '').replaceAll(RegExp(r'\s+'), '');
                if (widget.existingNames.contains(lname) ||
                    (cleanPhone.isNotEmpty &&
                        widget.existingPhones.contains(cleanPhone))) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                          'A player with this name or phone is already on a team.'),
                    ),
                  );
                  return;
                }
                final picked = (
                  name: n,
                  role: _role,
                  id: null,
                  isCustom: true,
                  phone: fullPhone,
                  avatar: null,
                ) as PickedPlayer;
                Navigator.pop(context, <PickedPlayer>[picked]);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: ScoringTheme.theme,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(_isReplace ? 'UPDATE PLAYER' : 'ADD CUSTOM PLAYER',
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ),
          ),
        ],
      ),
    );
  }
}

const String _searchCtrlEmptyHint = 'TYPE A NAME TO SEARCH';

// ── Ground picker ────────────────────────────────────────────────────────────

class _GroundPickerSheet extends StatefulWidget {
  final List<TurfModel>? Function() groundsFuture;
  final bool Function() loading;
  const _GroundPickerSheet(
      {required this.groundsFuture, required this.loading});

  @override
  State<_GroundPickerSheet> createState() => _GroundPickerSheetState();
}

class _GroundPickerSheetState extends State<_GroundPickerSheet> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.78;
    final list = widget.groundsFuture();
    final q = _searchCtrl.text.trim().toLowerCase();
    final filtered = list == null
        ? null
        : (q.isEmpty
            ? list
            : list
                .where((t) =>
                    t.name.toLowerCase().contains(q) ||
                    t.location.toLowerCase().contains(q) ||
                    (t.city ?? '').toLowerCase().contains(q))
                .toList());

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Pick a ground'),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              decoration: _sheetInputDecoration('Search grounds'),
            ),
          ),
          Expanded(
            child: widget.loading() || filtered == null
                ? const Center(
                    child: CircularProgressIndicator(color: ScoringTheme.theme))
                : filtered.isEmpty
                    ? const Center(
                        child: Text('NO GROUNDS FOUND',
                            style: TextStyle(
                                color: Colors.white38,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2)),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final g = filtered[i];
                          return GestureDetector(
                            onTap: () => Navigator.pop(context, g),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.03),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                    color:
                                        Colors.white.withValues(alpha: 0.06)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: ScoringTheme.tossPrimary
                                          .withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(LucideIcons.mapPin,
                                        color: ScoringTheme.tossPrimary,
                                        size: 18),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(g.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w800)),
                                        const SizedBox(height: 2),
                                        Text(
                                            [g.location, g.city]
                                                .where((s) =>
                                                    s != null && s.isNotEmpty)
                                                .join(' · '),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: Colors.white54,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ),
                                  const Icon(LucideIcons.chevronRight,
                                      color: Colors.white38, size: 16),
                                ],
                              ),
                            ),
                          );
                        }),
          ),
        ],
      ),
    );
  }
}

// ── Umpire picker ────────────────────────────────────────────────────────────

class _UmpirePickerSheet extends StatefulWidget {
  const _UmpirePickerSheet();

  @override
  State<_UmpirePickerSheet> createState() => _UmpirePickerSheetState();
}

class _UmpirePickerSheetState extends State<_UmpirePickerSheet> {
  final _searchCtrl = TextEditingController();
  String _city = '';
  String _state = '';
  // Defaulting to UMPIRE matches the way the picker is opened from the
  // add-ons step; the user can switch to STREAMER via the role tab strip.
  OfficialRole _role = OfficialRole.umpire;

  // Per-role cache. Each list is populated on first visit of the role tab,
  // then reused so swapping tabs doesn't refetch.
  final Map<OfficialRole, List<OfficialModel>> _cache = {};
  final Set<OfficialRole> _loading = {};

  @override
  void initState() {
    super.initState();
    _fetchIfNeeded(_role);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchIfNeeded(OfficialRole role) async {
    if (_cache.containsKey(role) || _loading.contains(role)) return;
    setState(() => _loading.add(role));
    try {
      final list = role == OfficialRole.streamer
          ? await GameService().getStreamers(gameType: 'Cricket')
          : await GameService().getUmpires(gameType: 'Cricket');
      if (!mounted) return;
      setState(() {
        _cache[role] = list;
        _loading.remove(role);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _cache[role] = const [];
        _loading.remove(role);
      });
    }
  }

  List<OfficialModel> _filtered(List<OfficialModel> list) {
    final q = _searchCtrl.text.trim().toLowerCase();
    return list.where((u) {
      if (_city.isNotEmpty &&
          (u.city ?? '').toLowerCase() != _city.toLowerCase()) {
        return false;
      }
      if (_state.isNotEmpty &&
          (u.state ?? '').toLowerCase() != _state.toLowerCase()) {
        return false;
      }
      if (q.isEmpty) return true;
      return u.name.toLowerCase().contains(q);
    }).toList();
  }

  // Roles mirror the web's professional categories. SCORER is intentionally
  // omitted — the bms backend currently exposes umpires + streamers only.
  static const _roleTabs = [OfficialRole.umpire, OfficialRole.streamer];
  static const _roleLabels = {
    OfficialRole.umpire: 'UMPIRES',
    OfficialRole.streamer: 'STREAMERS',
  };

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.78;
    final list = _cache[_role];
    final isLoading = _loading.contains(_role);
    final filtered = list == null ? null : _filtered(list);

    final cities = (list ?? const <OfficialModel>[])
        .map((u) => u.city ?? '')
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();
    final states = (list ?? const <OfficialModel>[])
        .map((u) => u.state ?? '')
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList();

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Pick a professional'),
          // Role tab strip — switching roles refetches lazily.
          _TabBarStrip(
            tabs: _roleTabs.map((r) => _roleLabels[r]!).toList(),
            active: _roleTabs.indexOf(_role),
            onSelect: (i) {
              setState(() => _role = _roleTabs[i]);
              _fetchIfNeeded(_roleTabs[i]);
            },
          ),
          // "Add custom" button — opens the custom-official sub-sheet for the
          // currently-active role. Stays visible regardless of search state.
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: GestureDetector(
              onTap: () async {
                final custom = await showModalBottomSheet<OfficialModel>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => _CustomOfficialSheet(initialRole: _role),
                );
                if (custom != null && mounted) {
                  Navigator.pop(context, custom);
                }
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  color: ScoringTheme.theme.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: ScoringTheme.theme.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.userPlus,
                        color: ScoringTheme.theme, size: 14),
                    const SizedBox(width: 8),
                    Text(
                        _role == OfficialRole.streamer
                            ? 'ADD CUSTOM STREAMER'
                            : 'ADD CUSTOM UMPIRE',
                        style: const TextStyle(
                            color: ScoringTheme.theme,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.8)),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              decoration: _sheetInputDecoration(_role == OfficialRole.streamer
                  ? 'Search streamers'
                  : 'Search umpires'),
            ),
          ),
          if (states.isNotEmpty || cities.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ...states.map((s) => _filterChip(
                          label: s,
                          active: _state == s,
                          onTap: () =>
                              setState(() => _state = _state == s ? '' : s),
                        )),
                    if (cities.isNotEmpty) const SizedBox(width: 6),
                    ...cities.map((c) => _filterChip(
                          label: c,
                          active: _city == c,
                          onTap: () =>
                              setState(() => _city = _city == c ? '' : c),
                        )),
                  ],
                ),
              ),
            ),
          Expanded(
            child: isLoading || filtered == null
                ? const Center(
                    child: CircularProgressIndicator(color: ScoringTheme.theme))
                : filtered.isEmpty
                    ? Center(
                        child: Text(
                            _role == OfficialRole.streamer
                                ? 'NO STREAMERS FOUND'
                                : 'NO UMPIRES FOUND',
                            style: const TextStyle(
                                color: Colors.white38,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2)),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => _umpireRow(filtered[i]),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: active
                ? ScoringTheme.accentSky.withValues(alpha: 0.18)
                : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: active
                    ? ScoringTheme.accentSky.withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.08)),
          ),
          child: Text(label,
              style: TextStyle(
                  color: active ? Colors.white : Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w800)),
        ),
      ),
    );
  }

  Widget _umpireRow(OfficialModel u) {
    return GestureDetector(
      onTap: () => Navigator.pop(context, u),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: ScoringTheme.tossPrimary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(u.name.isEmpty ? '?' : u.name[0].toUpperCase(),
                  style: const TextStyle(
                      color: ScoringTheme.tossPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(u.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(
                      [u.city, u.state]
                          .where((s) => s != null && s.isNotEmpty)
                          .join(' · '),
                      style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            if (u.price > 0)
              Text('₹${u.price.toStringAsFixed(0)}',
                  style: const TextStyle(
                      color: ScoringTheme.theme,
                      fontSize: 13,
                      fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }
}

// ── Country code picker ─────────────────────────────────────────────────────

/// Compact chip shown to the left of the phone input. Tapping it opens the
/// `_CountryCodePickerSheet`. Displays the flag emoji + `+91` style code.
class _CountryCodeChip extends StatelessWidget {
  final String code;
  final VoidCallback onTap;
  const _CountryCodeChip({required this.code, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = countryByDial(code);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(c.flag, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 6),
            Text('+${c.dial}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800)),
            const SizedBox(width: 4),
            const Icon(LucideIcons.chevronDown,
                color: Colors.white38, size: 14),
          ],
        ),
      ),
    );
  }
}

class _CountryCodePickerSheet extends StatefulWidget {
  /// Dial code currently selected — the matching row is highlighted on open.
  final String active;
  const _CountryCodePickerSheet({required this.active});

  @override
  State<_CountryCodePickerSheet> createState() =>
      _CountryCodePickerSheetState();
}

class _CountryCodePickerSheetState extends State<_CountryCodePickerSheet> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<CountryCode> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return kCountryCodes;
    return kCountryCodes.where((c) {
      return c.name.toLowerCase().contains(q) ||
          c.dial.contains(q) ||
          c.iso.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.78;
    final list = _filtered;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Country code'),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              decoration: _sheetInputDecoration('Search country or code'),
            ),
          ),
          Expanded(
            child: list.isEmpty
                ? const Center(
                    child: Text('NO MATCH',
                        style: TextStyle(
                            color: Colors.white38,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final c = list[i];
                      final active = c.dial == widget.active;
                      return GestureDetector(
                        onTap: () => Navigator.pop(context, c.dial),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: active
                                ? ScoringTheme.accentSky.withValues(alpha: 0.12)
                                : Colors.white.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: active
                                    ? ScoringTheme.accentSky
                                        .withValues(alpha: 0.4)
                                    : Colors.white.withValues(alpha: 0.06)),
                          ),
                          child: Row(
                            children: [
                              Text(c.flag,
                                  style: const TextStyle(fontSize: 20)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(c.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700)),
                              ),
                              Text('+${c.dial}',
                                  style: TextStyle(
                                      color: active
                                          ? ScoringTheme.accentSky
                                          : Colors.white54,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      );
                    }),
          ),
        ],
      ),
    );
  }
}

// ── Custom official add ─────────────────────────────────────────────────────

/// Inline form for adding a one-off umpire or streamer who isn't in the
/// professionals directory. The result is a synthesized `OfficialModel` with
/// `id: ''` so the caller can detect "this is a custom entry" and store the
/// name as a free-text field on the match record.
class _CustomOfficialSheet extends StatefulWidget {
  final OfficialRole initialRole;
  const _CustomOfficialSheet({required this.initialRole});

  @override
  State<_CustomOfficialSheet> createState() => _CustomOfficialSheetState();
}

class _CustomOfficialSheetState extends State<_CustomOfficialSheet> {
  late OfficialRole _role;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _countryCode = '91';

  @override
  void initState() {
    super.initState();
    _role = widget.initialRole;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Add custom professional'),
          // Role chip row — same two roles the picker exposes.
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
            child: Row(
              children: [
                _customRoleChip('UMPIRE', OfficialRole.umpire),
                const SizedBox(width: 8),
                _customRoleChip('STREAMER', OfficialRole.streamer),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: Column(
              children: [
                TextField(
                  controller: _nameCtrl,
                  autofocus: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: _sheetInputDecoration('Full name').copyWith(
                      prefixIcon: const Icon(LucideIcons.user,
                          color: Colors.white38, size: 18)),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _CountryCodeChip(
                      code: _countryCode,
                      onTap: () async {
                        final picked = await showModalBottomSheet<String>(
                          context: context,
                          backgroundColor: Colors.transparent,
                          isScrollControlled: true,
                          builder: (_) =>
                              _CountryCodePickerSheet(active: _countryCode),
                        );
                        if (picked != null && mounted) {
                          setState(() => _countryCode = picked);
                        }
                      },
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: Colors.white),
                        decoration:
                            _sheetInputDecoration('Phone (optional)').copyWith(
                          prefixIcon: const Icon(LucideIcons.phone,
                              color: Colors.white38, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      final n = _nameCtrl.text.trim();
                      if (n.isEmpty) return;
                      Navigator.pop(
                        context,
                        OfficialModel(
                          id: '',
                          name: n,
                          price: 0,
                          gameTypes: const ['Cricket'],
                          role: _role,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ScoringTheme.theme,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('ADD',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _customRoleChip(String label, OfficialRole role) {
    final sel = _role == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _role = role),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: sel
                ? ScoringTheme.accentSky.withValues(alpha: 0.18)
                : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: sel
                    ? ScoringTheme.accentSky.withValues(alpha: 0.4)
                    : Colors.white.withValues(alpha: 0.08)),
          ),
          child: Text(label,
              style: TextStyle(
                  color: sel ? Colors.white : Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.8)),
        ),
      ),
    );
  }
}

// ── Custom venue sheet ──────────────────────────────────────────────────────

class _CustomVenueResult {
  final String name;
  final String location;
  final double? lat;
  final double? lng;
  const _CustomVenueResult({
    required this.name,
    required this.location,
    this.lat,
    this.lng,
  });

  /// Display string for the venue chip — "Name · Location" if both present.
  String get label => location.isEmpty ? name : '$name · $location';
}

/// Bottom sheet for entering a venue that isn't in the grounds directory.
/// Has a "Detect my location" button that uses [geolocator] to pin GPS coords
/// — those flow back through the StartScoringResult so the backend can store
/// a real lat/lng on the match record.
class _CustomVenueSheet extends StatefulWidget {
  final String initialName;
  const _CustomVenueSheet({this.initialName = ''});

  @override
  State<_CustomVenueSheet> createState() => _CustomVenueSheetState();
}

class _CustomVenueSheetState extends State<_CustomVenueSheet> {
  late final TextEditingController _nameCtrl;
  final _locationCtrl = TextEditingController();
  double? _lat;
  double? _lng;
  bool _detecting = false;
  String? _detectError;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialName);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _detectLocation() async {
    setState(() {
      _detecting = true;
      _detectError = null;
    });
    try {
      // Ask for permission first — if denied or service is off, fall through
      // to a user-facing error rather than blowing up.
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        throw 'Location services are off. Enable them in system settings.';
      }
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        throw 'Location permission denied.';
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 15)),
      );
      if (!mounted) return;
      // Best-effort reverse geocode to populate the location field for the
      // user; failure here isn't fatal — the coords are what we actually need.
      try {
        final places =
            await placemarkFromCoordinates(pos.latitude, pos.longitude);
        if (places.isNotEmpty) {
          final p = places.first;
          final parts = <String>[
            if ((p.locality ?? '').isNotEmpty) p.locality!,
            if ((p.administrativeArea ?? '').isNotEmpty) p.administrativeArea!,
            if ((p.country ?? '').isNotEmpty) p.country!,
          ];
          if (parts.isNotEmpty && _locationCtrl.text.trim().isEmpty) {
            _locationCtrl.text = parts.join(', ');
          }
        }
      } catch (_) {/* reverse-geocode is optional */}
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _detecting = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _detecting = false;
        _detectError = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          _sheetHandle(),
          _sheetHeader('Add custom venue'),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _nameCtrl,
                  autofocus: true,
                  style: const TextStyle(color: Colors.white),
                  decoration: _sheetInputDecoration('Venue name').copyWith(
                      prefixIcon: const Icon(LucideIcons.flag,
                          color: Colors.white38, size: 18)),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _locationCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration:
                      _sheetInputDecoration('City / area (optional)').copyWith(
                    prefixIcon: const Icon(LucideIcons.mapPin,
                        color: Colors.white38, size: 18),
                  ),
                ),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: _detecting ? null : _detectLocation,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: ScoringTheme.accentSky.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: ScoringTheme.accentSky.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        if (_detecting)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: ScoringTheme.accentSky),
                          )
                        else
                          const Icon(LucideIcons.locate,
                              color: ScoringTheme.accentSky, size: 14),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _lat != null && _lng != null
                                ? 'GPS: ${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                                : (_detecting
                                    ? 'DETECTING…'
                                    : 'DETECT CURRENT LOCATION'),
                            style: const TextStyle(
                                color: ScoringTheme.accentSky,
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_detectError != null) ...[
                  const SizedBox(height: 6),
                  Text(_detectError!,
                      style: const TextStyle(
                          color: Color(0xFFFCA5A5),
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      final n = _nameCtrl.text.trim();
                      if (n.isEmpty) return;
                      Navigator.pop(
                        context,
                        _CustomVenueResult(
                          name: n,
                          location: _locationCtrl.text.trim(),
                          lat: _lat,
                          lng: _lng,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ScoringTheme.theme,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('SAVE VENUE',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2)),
                  ),
                ),
                const SizedBox(height: 18),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SelectDot extends StatelessWidget {
  final bool selected;
  const _SelectDot({required this.selected});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: selected ? ScoringTheme.theme : Colors.transparent,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: selected ? ScoringTheme.theme : Colors.white38,
          width: 2,
        ),
      ),
      child: selected
          ? const Icon(LucideIcons.check, size: 12, color: Colors.black)
          : null,
    );
  }
}

// ── Squad picker ─────────────────────────────────────────────────────────────
// Opens when the team picked from the library has more members than the
// chosen players-per-side. The user must check exactly `targetCount` from
// the squad before they can confirm. Less / more is rejected.

class _SquadPickerSheet extends StatefulWidget {
  final String teamName;
  final List<PickedPlayer> squad;
  final int targetCount;

  const _SquadPickerSheet({
    required this.teamName,
    required this.squad,
    required this.targetCount,
  });

  @override
  State<_SquadPickerSheet> createState() => _SquadPickerSheetState();
}

class _SquadPickerSheetState extends State<_SquadPickerSheet> {
  final Set<int> _selected = <int>{};

  void _toggle(int i) {
    setState(() {
      if (_selected.contains(i)) {
        _selected.remove(i);
      } else {
        if (_selected.length >= widget.targetCount) {
          // Soft cap — silently ignore extra taps so the user gets the
          // signal that they're at the limit (the Confirm button glow
          // confirms the count is right).
          return;
        }
        _selected.add(i);
      }
    });
  }

  void _confirm() {
    final ordered = _selected.toList()..sort();
    final picked = ordered.map((i) => widget.squad[i]).toList();
    Navigator.pop(context, picked);
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final ready = _selected.length == widget.targetCount;
    return Container(
      height: mq.size.height * 0.9 - mq.viewInsets.bottom,
      decoration: const BoxDecoration(
        color: _sheetBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          _sheetHandle(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('PICK PLAYING XI',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                    )),
                const SizedBox(height: 4),
                Text(
                  '${widget.teamName.toUpperCase()}  •  ${widget.squad.length} IN SQUAD',
                  style: const TextStyle(
                    color: ScoringTheme.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: ready
                        ? ScoringTheme.theme.withValues(alpha: 0.14)
                        : ScoringTheme.accentSky.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: ready
                          ? ScoringTheme.theme.withValues(alpha: 0.5)
                          : ScoringTheme.accentSky.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        ready ? LucideIcons.checkCircle : LucideIcons.users,
                        color:
                            ready ? ScoringTheme.theme : ScoringTheme.accentSky,
                        size: 14,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_selected.length} / ${widget.targetCount} SELECTED',
                        style: TextStyle(
                          color: ready
                              ? ScoringTheme.theme
                              : ScoringTheme.accentSky,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.6,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              separatorBuilder: (_, __) => const SizedBox(height: 6),
              itemCount: widget.squad.length,
              itemBuilder: (_, i) {
                final p = widget.squad[i];
                final selected = _selected.contains(i);
                final atCap =
                    !selected && _selected.length >= widget.targetCount;
                return GestureDetector(
                  onTap: atCap ? null : () => _toggle(i),
                  child: Opacity(
                    opacity: atCap ? 0.4 : 1.0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: selected
                            ? ScoringTheme.theme.withValues(alpha: 0.14)
                            : Colors.white.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: selected
                              ? ScoringTheme.theme.withValues(alpha: 0.5)
                              : Colors.transparent,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: ScoringTheme.accentSky
                                  .withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              p.name.isEmpty ? '?' : p.name[0].toUpperCase(),
                              style: const TextStyle(
                                color: ScoringTheme.accentSky,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  p.role.replaceAll('_', ' '),
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          _SelectDot(selected: selected),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context, null),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: ScoringTheme.textSubtle,
                          backgroundColor: ScoringTheme.bgPanelDeep,
                          side: const BorderSide(
                              color: ScoringTheme.borderSubtle),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('CANCEL',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.4,
                            )),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: ready ? _confirm : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ScoringTheme.theme,
                          foregroundColor: Colors.black,
                          disabledBackgroundColor: const Color(0xFF2A2A2A),
                          disabledForegroundColor:
                              Colors.white.withValues(alpha: 0.5),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text(
                          ready
                              ? 'CONFIRM PLAYING XI'
                              : 'PICK ${widget.targetCount - _selected.length} MORE',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 2,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
