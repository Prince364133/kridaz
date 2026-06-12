import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class FieldingPositionResult {
  final String? position;
  final String? distance;
  const FieldingPositionResult({this.position, this.distance});
}

const _positions = <(String, String)>[
  ('DEEP_MID_WICKET', 'Deep Mid Wicket'),
  ('LONG_ON', 'Long On'),
  ('LONG_OFF', 'Long Off'),
  ('DEEP_COVER', 'Deep Cover'),
  ('DEEP_POINT', 'Deep Point'),
  ('THIRD_MAN', 'Third Man'),
  ('DEEP_FINE_LEG', 'Deep Fine Leg'),
  ('DEEP_SQUARE_LEG', 'Deep Square Leg'),
];

const _distances = <(String, String)>[
  ('SHORT', 'Short'),
  ('MID', 'Mid'),
  ('AFTER_MID', 'After Mid'),
  ('BOUNDARY', 'Boundary'),
];

/// Two-step pick — position then distance. Boundaries skip the distance step.
/// Port of `FieldingPositionModal.jsx`.
class FieldingPositionModal extends StatefulWidget {
  final int runs;
  final bool isBoundary;
  final void Function(FieldingPositionResult) onConfirm;
  final VoidCallback onClose;

  const FieldingPositionModal({
    super.key,
    required this.runs,
    required this.isBoundary,
    required this.onConfirm,
    required this.onClose,
  });

  @override
  State<FieldingPositionModal> createState() => _FieldingPositionModalState();
}

class _FieldingPositionModalState extends State<FieldingPositionModal> {
  String _step = 'position';
  String? _position;

  void _selectPosition(String key) {
    HapticFeedback.selectionClick();
    setState(() => _position = key);
    if (widget.isBoundary) {
      widget.onConfirm(
          FieldingPositionResult(position: key, distance: 'BOUNDARY'));
    } else {
      setState(() => _step = 'distance');
    }
  }

  void _selectDistance(String key) {
    HapticFeedback.selectionClick();
    widget
        .onConfirm(FieldingPositionResult(position: _position, distance: key));
  }

  @override
  Widget build(BuildContext context) {
    final isPos = _step == 'position';
    return Material(
      color: Colors.black.withValues(alpha: 0.85),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 450),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: const Color(0xFF3B82F6).withValues(alpha: 0.2)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                      decoration: BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Colors.white.withValues(alpha: 0.1))),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6)
                                  .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.target,
                                color: Color(0xFF60A5FA), size: 16),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                    isPos
                                        ? 'WHERE WAS IT HIT?'
                                        : 'HOW FAR DID IT GO?',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900)),
                                const SizedBox(height: 2),
                                Text('WAGON WHEEL • ${widget.runs} RUNS',
                                    style: const TextStyle(
                                        color: Color(0xFF60A5FA),
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 2.4)),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => widget
                                .onConfirm(const FieldingPositionResult()),
                            child: const Icon(LucideIcons.x,
                                color: Colors.white54, size: 16),
                          ),
                        ],
                      ),
                    ),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            GridView.count(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              crossAxisCount: 2,
                              mainAxisSpacing: 8,
                              crossAxisSpacing: 8,
                              childAspectRatio: 3,
                              children: (isPos ? _positions : _distances)
                                  .map((entry) => _cell(
                                      entry.$1,
                                      entry.$2,
                                      isPos
                                          ? _selectPosition
                                          : _selectDistance))
                                  .toList(),
                            ),
                            if (isPos) ...[
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () => widget
                                    .onConfirm(const FieldingPositionResult()),
                                child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color:
                                          Colors.white.withValues(alpha: 0.15),
                                      style: BorderStyle.solid,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text('SKIP WAGON WHEEL',
                                      style: TextStyle(
                                          color: Colors.white54,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 1)),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    if (!isPos)
                      Container(
                        padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
                        decoration: BoxDecoration(
                          border: Border(
                              top: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.1))),
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => setState(() => _step = 'position'),
                            child: const Text('← BACK',
                                style: TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2)),
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
    );
  }

  Widget _cell(String key, String label, void Function(String) onTap) {
    return GestureDetector(
      onTap: () => onTap(key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.centerLeft,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w900)),
      ),
    );
  }
}
