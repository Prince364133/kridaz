import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'scoring_theme.dart';

class TickerThemeOption {
  final String id;
  final String name;
  final String description;
  final Color primary;
  final Color secondary;
  final String? previewFontFamily;
  const TickerThemeOption({
    required this.id,
    required this.name,
    required this.description,
    required this.primary,
    required this.secondary,
    this.previewFontFamily,
  });
}

const _defaultThemes = <TickerThemeOption>[
  TickerThemeOption(
    id: 'neon_classic',
    name: 'Neon Classic',
    description:
        'High-contrast neon green over slate, the default broadcast look.',
    primary: Color(0xFFA3E635),
    secondary: Color(0xFF0F172A),
  ),
  TickerThemeOption(
    id: 'premium_glass',
    name: 'Premium Glass',
    description: 'Frosted white glass with subtle borders.',
    primary: Colors.white,
    secondary: Color(0x33FFFFFF),
  ),
  TickerThemeOption(
    id: 'retro_arcade',
    name: 'Retro Arcade',
    description: '8-bit magenta + cyan on jet black.',
    primary: Color(0xFFFF00FF),
    secondary: Color(0xFF00FFFF),
  ),
  TickerThemeOption(
    id: 'sports_network',
    name: 'Sports Network',
    description: 'Bold red + navy on white — broadcast-channel feel.',
    primary: Color(0xFF1E3A8A),
    secondary: Color(0xFFDC2626),
  ),
  TickerThemeOption(
    id: 'cyber_pulse',
    name: 'Cyber Pulse',
    description: 'Electric cyan on near-black with sharp accents.',
    primary: Color(0xFF00F3FF),
    secondary: Color(0xFF94A3B8),
  ),
];

/// Picker for the OBS overlay ticker theme. Port of
/// `TickerThemeStoreModal.jsx`. Returns the selected theme id via [onApply].
class TickerThemeStoreModal extends StatefulWidget {
  final String activeTheme;
  final List<TickerThemeOption> themes;
  final Future<bool> Function(String themeId) onApply;
  final VoidCallback onClose;

  const TickerThemeStoreModal({
    super.key,
    required this.activeTheme,
    this.themes = _defaultThemes,
    required this.onApply,
    required this.onClose,
  });

  @override
  State<TickerThemeStoreModal> createState() => _TickerThemeStoreModalState();
}

class _TickerThemeStoreModalState extends State<TickerThemeStoreModal> {
  late String _selected;
  bool _applying = false;

  @override
  void initState() {
    super.initState();
    _selected = widget.activeTheme;
  }

  Future<void> _apply() async {
    setState(() => _applying = true);
    final ok = await widget.onApply(_selected);
    if (!mounted) return;
    setState(() => _applying = false);
    if (ok) widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.9),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 480),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0A0A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 20, 16, 16),
                    decoration: BoxDecoration(
                      border: Border(
                          bottom: BorderSide(
                              color: Colors.white.withValues(alpha: 0.05))),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.sparkles,
                            color: ScoringTheme.theme, size: 18),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text('TICKER THEME STORE',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.3)),
                        ),
                        GestureDetector(
                          onTap: widget.onClose,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      padding: const EdgeInsets.all(16),
                      itemCount: widget.themes.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => _row(widget.themes[i]),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border(
                          top: BorderSide(
                              color: Colors.white.withValues(alpha: 0.05))),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: SizedBox(
                            height: 50,
                            child: OutlinedButton(
                              onPressed: _applying ? null : widget.onClose,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white54,
                                backgroundColor: ScoringTheme.bgControlBar,
                                side: BorderSide(
                                    color:
                                        Colors.white.withValues(alpha: 0.05)),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('CANCEL',
                                  style: TextStyle(
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
                            height: 50,
                            child: ElevatedButton(
                              onPressed: _applying
                                  ? null
                                  : () {
                                      HapticFeedback.mediumImpact();
                                      _apply();
                                    },
                              style: ElevatedButton.styleFrom(
                                foregroundColor: Colors.black,
                                backgroundColor: ScoringTheme.theme,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: _applying
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                          color: Colors.black, strokeWidth: 2))
                                  : const Text('APPLY THEME',
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 2.4)),
                            ),
                          ),
                        ),
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

  Widget _row(TickerThemeOption t) {
    final selected = _selected == t.id;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selected = t.id);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: selected
                  ? ScoringTheme.theme
                  : Colors.white.withValues(alpha: 0.08),
              width: selected ? 2 : 1),
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: ScoringTheme.theme.withValues(alpha: 0.15),
                      blurRadius: 20)
                ]
              : null,
        ),
        child: Row(
          children: [
            // Preview swatch
            Container(
              width: 80,
              height: 60,
              decoration: BoxDecoration(
                color: t.secondary,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: t.primary, width: 2),
              ),
              alignment: Alignment.center,
              child: Text('120/2',
                  style: TextStyle(
                      color: t.primary,
                      fontSize: 16,
                      fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.name.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5)),
                  const SizedBox(height: 4),
                  Text(t.description.toUpperCase(),
                      style: const TextStyle(
                          color: Color(0xFF888888),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                          height: 1.4)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (selected)
              const Icon(LucideIcons.checkCircle2,
                  color: ScoringTheme.theme, size: 20)
            else
              Icon(LucideIcons.circle,
                  color: Colors.white.withValues(alpha: 0.2), size: 20),
          ],
        ),
      ),
    );
  }
}
