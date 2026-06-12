import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

/// Full-screen scoring settings panel — port of the inline settings modal in
/// `ScoringApp.jsx`. Sections: broadcast credentials, OBS overlay URL + theme
/// switcher, match state, AI commentary, DLS revision, officials, match rules
/// (powerplay + reviews), match analysis links.
///
/// State and persistence are owned by the caller; each input/button raises a
/// callback so the scoring screen can wire it into its own state and the
/// existing `ScoringService` calls.
class SettingsPanel extends StatefulWidget {
  // Status / state ----------------------------------------------------------
  final String? matchStatus; // LIVE | RAIN_DELAY | BAD_LIGHT
  final void Function(String status) onUpdateMatchStatus;

  // Live broadcast / OBS ---------------------------------------------------
  // `isLive` means the backend has provisioned a hosted game for this match
  // (URLs are available). `streamingEnabled` is the *user's* intent — when
  // OFF, all OBS-specific UI is hidden so scorers who only need a public
  // scoreboard link don't see broadcast clutter.
  final bool isLive;
  final bool streamingEnabled;
  final void Function(bool enabled) onToggleStreaming;
  final String? obsOverlayUrl;
  final String? publicScoreboardUrl;
  final String? youtubeVideoId;
  final void Function(String youtubeId) onAuthorizeStream;
  final VoidCallback onChangeTickerTheme;
  final VoidCallback? onPreviewTheme;

  // AI commentary ----------------------------------------------------------
  final bool aiEnabled;
  final String commentaryLanguage;
  final String commentaryVoice;
  final String commentaryStyle;
  final void Function({
    required bool enabled,
    required String language,
    required String voice,
    required String style,
  }) onSaveCommentary;

  // DLS / target -----------------------------------------------------------
  final int? revisedTarget;
  final double? revisedOvers;
  final void Function(int target, double overs) onReviseTarget;

  // Officials --------------------------------------------------------------
  final String umpire1;
  final String umpire2;
  final String matchReferee;
  final void Function({
    required String umpire1,
    required String umpire2,
    required String matchReferee,
  }) onSaveOfficials;

  // Rules ------------------------------------------------------------------
  final int powerplayOvers;
  final int battingReviewsRemaining;
  final int fieldingReviewsRemaining;
  final void Function(int overs) onSetPowerplay;
  final void Function({required String team, required bool successful})
      onUseReview;

  // Analysis ---------------------------------------------------------------
  final VoidCallback onOpenMatchReport;
  final VoidCallback onOpenLiveAnalytics;

  final VoidCallback onClose;

  const SettingsPanel({
    super.key,
    required this.matchStatus,
    required this.onUpdateMatchStatus,
    required this.isLive,
    required this.streamingEnabled,
    required this.onToggleStreaming,
    required this.obsOverlayUrl,
    required this.publicScoreboardUrl,
    required this.youtubeVideoId,
    required this.onAuthorizeStream,
    required this.onChangeTickerTheme,
    this.onPreviewTheme,
    required this.aiEnabled,
    required this.commentaryLanguage,
    required this.commentaryVoice,
    required this.commentaryStyle,
    required this.onSaveCommentary,
    required this.revisedTarget,
    required this.revisedOvers,
    required this.onReviseTarget,
    required this.umpire1,
    required this.umpire2,
    required this.matchReferee,
    required this.onSaveOfficials,
    required this.powerplayOvers,
    required this.battingReviewsRemaining,
    required this.fieldingReviewsRemaining,
    required this.onSetPowerplay,
    required this.onUseReview,
    required this.onOpenMatchReport,
    required this.onOpenLiveAnalytics,
    required this.onClose,
  });

  @override
  State<SettingsPanel> createState() => _SettingsPanelState();
}

class _SettingsPanelState extends State<SettingsPanel> {
  late final TextEditingController _yt;
  late final TextEditingController _target;
  late final TextEditingController _overs;
  late final TextEditingController _u1;
  late final TextEditingController _u2;
  late final TextEditingController _referee;
  late final TextEditingController _powerplay;

  late bool _aiEnabled;
  late String _language;
  late String _voice;
  late String _style;
  // Local copy so the highlighted state-button switches the instant the user
  // taps — the parent does the network round-trip and is the source of truth,
  // but we don't want to wait for it before updating the UI.
  late String _localStatus;

  @override
  void initState() {
    super.initState();
    _yt = TextEditingController(text: widget.youtubeVideoId ?? '');
    _target = TextEditingController(
        text: widget.revisedTarget != null ? '${widget.revisedTarget}' : '');
    _overs = TextEditingController(
        text: widget.revisedOvers != null ? '${widget.revisedOvers}' : '');
    _u1 = TextEditingController(text: widget.umpire1);
    _u2 = TextEditingController(text: widget.umpire2);
    _referee = TextEditingController(text: widget.matchReferee);
    _powerplay = TextEditingController(text: '${widget.powerplayOvers}');
    _aiEnabled = widget.aiEnabled;
    _language = widget.commentaryLanguage;
    _voice = widget.commentaryVoice;
    _style = widget.commentaryStyle;
    _localStatus = widget.matchStatus ?? 'LIVE';
  }

  @override
  void didUpdateWidget(SettingsPanel old) {
    super.didUpdateWidget(old);
    // If the parent pushes a new status from outside (rare — usually the
    // local tap is the source), keep in sync.
    if (widget.matchStatus != null && widget.matchStatus != old.matchStatus) {
      _localStatus = widget.matchStatus!;
    }
  }

  @override
  void dispose() {
    _yt.dispose();
    _target.dispose();
    _overs.dispose();
    _u1.dispose();
    _u2.dispose();
    _referee.dispose();
    _powerplay.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.95),
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 450),
            child: Container(
              color: Colors.black,
              child: Column(
                children: [
                  _header(),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
                      children: [
                        if (!widget.isLive)
                          _connectingBlock()
                        else ...[
                          _streamingToggleRow(),
                          if (widget.streamingEnabled) ...[
                            const SizedBox(height: 16),
                            _sectionLabel('Broadcast Credentials'),
                            _broadcastSection(),
                            const SizedBox(height: 24),
                            _aiCommentarySection(),
                            const SizedBox(height: 24),
                          ] else ...[
                            const SizedBox(height: 16),
                          ],
                          if (widget.publicScoreboardUrl != null) ...[
                            _sectionLabel('Public Scoreboard'),
                            _publicScoreboardSection(),
                            const SizedBox(height: 24),
                          ],
                        ],
                        _sectionLabel('Match State'),
                        _matchStateSection(),
                        const SizedBox(height: 24),
                        _dlsSection(),
                        const SizedBox(height: 24),
                        _officialsSection(),
                        const SizedBox(height: 24),
                        _matchRulesSection(),
                        const SizedBox(height: 24),
                        _matchAnalysisSection(),
                        const SizedBox(height: 32),
                        _saveButton(),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _header() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text('INTERFACE CONFIG',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5)),
          ),
          GestureDetector(
            onTap: widget.onClose,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child:
                  const Icon(LucideIcons.x, color: Color(0xFF888888), size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _connectingBlock() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      alignment: Alignment.center,
      child: Column(
        children: const [
          SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(
                color: ScoringTheme.theme, strokeWidth: 2),
          ),
          SizedBox(height: 16),
          Text('ESTABLISHING SYNC...',
              style: TextStyle(
                  color: Color(0xFF666666),
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2)),
        ],
      ),
    );
  }

  // ── Streaming toggle ───────────────────────────────────────────────────────

  Widget _streamingToggleRow() {
    final on = widget.streamingEnabled;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: on
            ? ScoringTheme.theme.withValues(alpha: 0.06)
            : Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: on
                ? ScoringTheme.theme.withValues(alpha: 0.3)
                : Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.video,
              color: on ? ScoringTheme.theme : const Color(0xFF888888),
              size: 16),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIVE STREAMING',
                  style: TextStyle(
                      color: on ? ScoringTheme.theme : Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5),
                ),
                const SizedBox(height: 2),
                Text(
                  on
                      ? 'BROADCAST CONTROLS VISIBLE'
                      : 'TURN ON TO REVEAL OBS / YOUTUBE CONTROLS',
                  style: const TextStyle(
                      color: Color(0xFF666666),
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.5),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: on,
            activeThumbColor: Colors.black,
            activeTrackColor: ScoringTheme.theme,
            inactiveTrackColor: Colors.white.withValues(alpha: 0.1),
            onChanged: (v) {
              HapticFeedback.selectionClick();
              widget.onToggleStreaming(v);
            },
          ),
        ],
      ),
    );
  }

  // ── Broadcast / OBS ────────────────────────────────────────────────────────

  Widget _broadcastSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _input(
          controller: _yt,
          hint: 'YouTube ID...',
          paddingV: 14,
        ),
        const SizedBox(height: 12),
        _dimButton(
          label: 'AUTHORIZE STREAM',
          color: ScoringTheme.theme,
          onTap: () => widget.onAuthorizeStream(_yt.text.trim()),
        ),
        if (widget.obsOverlayUrl != null) ...[
          const SizedBox(height: 24),
          _divider(),
          const SizedBox(height: 16),
          _sectionLabel('OBS Overlay (Copy into Browser Source)', small: true),
          _copyRow(widget.obsOverlayUrl!),
          const SizedBox(height: 8),
          _dimButton(
            label: 'CHANGE TICKER THEME',
            color: ScoringTheme.theme,
            icon: LucideIcons.sparkles,
            onTap: widget.onChangeTickerTheme,
          ),
          if (widget.onPreviewTheme != null) ...[
            const SizedBox(height: 8),
            _dimButton(
                label: 'PREVIEW THEME',
                color: ScoringTheme.theme,
                onTap: widget.onPreviewTheme!),
          ],
        ],
      ],
    );
  }

  // ── Public scoreboard (always visible when the hosted game has a URL) ─────

  Widget _publicScoreboardSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text(
            'SHARE THIS LINK WITH VIEWERS — NO STREAM NEEDED.',
            style: TextStyle(
                color: Color(0xFF666666),
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
                height: 1.4),
          ),
        ),
        _copyRow(widget.publicScoreboardUrl!),
      ],
    );
  }

  Widget _copyRow(String value) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF222222),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: Color(0xFF888888),
                    fontSize: 10,
                    fontWeight: FontWeight.w700)),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            Clipboard.setData(ClipboardData(text: value));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Copied!'), duration: Duration(seconds: 1)),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF222222),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: const Text('COPY',
                style: TextStyle(
                    color: ScoringTheme.theme,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5)),
          ),
        ),
      ],
    );
  }

  // ── Match state ────────────────────────────────────────────────────────────

  Widget _matchStateSection() {
    return Row(
      children: [
        Expanded(child: _stateButton('LIVE', 'Live', ScoringTheme.theme)),
        const SizedBox(width: 8),
        Expanded(
            child: _stateButton(
                'RAIN_DELAY', 'Rain Delay', const Color(0xFF60A5FA))),
        const SizedBox(width: 8),
        Expanded(
            child: _stateButton(
                'BAD_LIGHT', 'Bad Light', const Color(0xFFFB923C))),
      ],
    );
  }

  Widget _stateButton(String value, String label, Color accent) {
    final active = _localStatus == value;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _localStatus = value);
        widget.onUpdateMatchStatus(value);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active
              ? accent.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color:
                  active ? accent.withValues(alpha: 0.3) : Colors.transparent),
        ),
        child: Text(label.toUpperCase(),
            style: TextStyle(
                color: active ? accent : const Color(0xFF888888),
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5)),
      ),
    );
  }

  // ── AI commentary ──────────────────────────────────────────────────────────

  Widget _aiCommentarySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Expanded(
              child: Text('AI COMMENTATOR (OPENAI TTS)',
                  style: TextStyle(
                      color: Color(0xFF666666),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2)),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _aiEnabled
                    ? const Color(0xFF222222)
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(_aiEnabled ? 'ACTIVE' : 'OFF',
                  style: TextStyle(
                      color: _aiEnabled
                          ? ScoringTheme.theme
                          : const Color(0xFF666666),
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _dimButton(
          label: _aiEnabled ? 'DISABLE' : 'ENABLE COMMENTARY',
          color: _aiEnabled ? ScoringTheme.theme : Colors.white,
          onTap: () => setState(() => _aiEnabled = !_aiEnabled),
        ),
        if (_aiEnabled) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                  child: _select(
                      value: _language,
                      options: const [
                        ('en', 'English (Default)'),
                        ('hi', 'Hindi'),
                        ('pa', 'Punjabi'),
                        ('bn', 'Bengali'),
                        ('mr', 'Marathi'),
                        ('ta', 'Tamil'),
                        ('te', 'Telugu'),
                        ('gu', 'Gujarati'),
                      ],
                      onChanged: (v) => setState(() => _language = v))),
              const SizedBox(width: 8),
              Expanded(
                  child: _select(
                      value: _voice,
                      options: const [
                        ('alloy', 'Alloy (Neutral)'),
                        ('echo', 'Echo (Male, Warm)'),
                        ('fable', 'Fable (Male, British)'),
                        ('onyx', 'Onyx (Male, Deep)'),
                        ('nova', 'Nova (Female, Pro)'),
                        ('shimmer', 'Shimmer (Female, Bright)'),
                      ],
                      onChanged: (v) => setState(() => _voice = v))),
            ],
          ),
          const SizedBox(height: 8),
          _select(
              value: _style,
              options: const [
                ('professional', 'Professional Broadcast'),
                ('natural', 'Natural Human (Casual)'),
                ('funny', 'Funny & Witty'),
                ('dramatic', 'High Energy / Dramatic'),
              ],
              onChanged: (v) => setState(() => _style = v)),
          const SizedBox(height: 12),
          _dimButton(
            label: 'SAVE COMMENTARY PROFILE',
            color: ScoringTheme.theme,
            onTap: () => widget.onSaveCommentary(
              enabled: _aiEnabled,
              language: _language,
              voice: _voice,
              style: _style,
            ),
          ),
        ],
      ],
    );
  }

  // ── DLS / Target revision ──────────────────────────────────────────────────

  Widget _dlsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('DLS / Target Revision'),
        Row(
          children: [
            Expanded(
                child: _input(
                    controller: _target,
                    hint: 'Revised Target',
                    keyboardType: TextInputType.number)),
            const SizedBox(width: 8),
            Expanded(
                child: _input(
                    controller: _overs,
                    hint: 'Revised Overs',
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true))),
          ],
        ),
        const SizedBox(height: 12),
        _tintedButton(
          label: 'APPLY DLS REVISION',
          color: const Color(0xFFA855F7),
          onTap: () {
            final t = int.tryParse(_target.text.trim());
            final o = double.tryParse(_overs.text.trim());
            if (t == null || o == null) return;
            widget.onReviseTarget(t, o);
          },
        ),
      ],
    );
  }

  // ── Officials ──────────────────────────────────────────────────────────────

  Widget _officialsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Match Officials'),
        Row(
          children: [
            Expanded(child: _input(controller: _u1, hint: 'Umpire 1')),
            const SizedBox(width: 8),
            Expanded(child: _input(controller: _u2, hint: 'Umpire 2')),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
                child: _input(controller: _referee, hint: 'Match Referee')),
            const SizedBox(width: 8),
            Expanded(
              child: _tintedButton(
                label: 'SAVE',
                color: const Color(0xFF3B82F6),
                onTap: () => widget.onSaveOfficials(
                  umpire1: _u1.text.trim(),
                  umpire2: _u2.text.trim(),
                  matchReferee: _referee.text.trim(),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Match rules: powerplay + reviews ──────────────────────────────────────

  Widget _matchRulesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Match Rules'),
        Row(
          children: [
            Expanded(
                child: _input(
                    controller: _powerplay,
                    hint: 'Powerplay Overs',
                    keyboardType: TextInputType.number)),
            const SizedBox(width: 8),
            Expanded(
              child: _dimButton(
                label: 'SET POWERPLAY',
                color: ScoringTheme.theme,
                onTap: () {
                  final n = int.tryParse(_powerplay.text.trim());
                  if (n != null) widget.onSetPowerplay(n);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _tintedButton(
                label: 'BATTING REVIEW (${widget.battingReviewsRemaining})',
                color: const Color(0xFFEAB308),
                onTap: () => _confirmReview('Batting', 'batting'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _tintedButton(
                label: 'FIELDING REVIEW (${widget.fieldingReviewsRemaining})',
                color: const Color(0xFFEAB308),
                onTap: () => _confirmReview('Fielding', 'fielding'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _confirmReview(String label, String team) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: const Color(0xFF111111),
        title: Text("$label review",
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                letterSpacing: 1)),
        content: Text('Was the $label team\'s review successful?',
            style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('NO', style: TextStyle(color: Colors.white60))),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: const Text('YES',
                  style: TextStyle(color: ScoringTheme.theme))),
        ],
      ),
    );
    if (ok == null) return;
    widget.onUseReview(team: team, successful: ok);
  }

  // ── Match analysis ─────────────────────────────────────────────────────────

  Widget _matchAnalysisSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('Match Analysis'),
        Row(
          children: [
            Expanded(
              child: _dimButton(
                label: 'MATCH REPORT',
                color: ScoringTheme.theme,
                icon: LucideIcons.fileText,
                onTap: widget.onOpenMatchReport,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _tintedButton(
                label: 'LIVE ANALYTICS',
                color: ScoringTheme.accentSky,
                icon: LucideIcons.trendingUp,
                onTap: widget.onOpenLiveAnalytics,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Save footer ───────────────────────────────────────────────────────────

  Widget _saveButton() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        widget.onClose();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: ScoringTheme.theme,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
                color: ScoringTheme.theme.withValues(alpha: 0.3),
                blurRadius: 30,
                offset: const Offset(0, 10)),
          ],
        ),
        child: const Text('SAVE PARAMETERS',
            style: TextStyle(
                color: Colors.black,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.4)),
      ),
    );
  }

  // ── Shared bits ───────────────────────────────────────────────────────────

  Widget _sectionLabel(String text, {bool small = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(text.toUpperCase(),
          style: TextStyle(
              color: const Color(0xFF666666),
              fontSize: small ? 8 : 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.4)),
    );
  }

  Widget _divider() =>
      Container(height: 1, color: Colors.white.withValues(alpha: 0.05));

  Widget _input({
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    double paddingV = 14,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(
          color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24, fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF222222),
        contentPadding:
            EdgeInsets.symmetric(horizontal: 16, vertical: paddingV),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide:
                BorderSide(color: ScoringTheme.theme.withValues(alpha: 0.5))),
      ),
    );
  }

  Widget _select({
    required String value,
    required List<(String, String)> options,
    required void Function(String) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF222222),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: const Color(0xFF222222),
          icon: const Icon(LucideIcons.chevronDown,
              color: Colors.white54, size: 16),
          style: const TextStyle(
              color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
          items: options
              .map((o) => DropdownMenuItem(
                    value: o.$1,
                    child: Text(o.$2),
                  ))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }

  Widget _dimButton({
    required String label,
    required Color color,
    IconData? icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF222222),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, color: color, size: 12),
              const SizedBox(width: 6),
            ],
            Text(label,
                style: TextStyle(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2.4)),
          ],
        ),
      ),
    );
  }

  Widget _tintedButton({
    required String label,
    required Color color,
    IconData? icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, color: color, size: 12),
              const SizedBox(width: 6),
            ],
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.8)),
          ],
        ),
      ),
    );
  }
}
