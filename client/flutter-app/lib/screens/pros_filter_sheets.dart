import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:table_calendar/table_calendar.dart';
import '../widgets/common/filter_apply_button.dart';

/// Shared shell for every filter sheet (Experience, Rating, Distance,
/// Select Date). Header with X close, centered title, content area, and a
/// pinned grey-pill Apply button at the bottom.
class _SheetShell extends StatelessWidget {
  final String title;
  final Widget child;
  final VoidCallback onApply;
  const _SheetShell({
    required this.title,
    required this.child,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: const Icon(LucideIcons.x,
                          color: Colors.white, size: 22),
                    ),
                    Expanded(
                      child: Center(
                        child: Text(title,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Poppins')),
                      ),
                    ),
                    const SizedBox(width: 22),
                  ],
                ),
              ),
              Flexible(child: child),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: FilterApplyButton(onTap: onApply),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Experience ─────────────────────────────────────────────────────────

const _experienceOptions = ['0-1 Year', '2-4 Year', '5-7 Year', '8+ Year'];

Future<Set<String>?> showExperienceSheet(
    BuildContext context, Set<String> initial) {
  return showModalBottomSheet<Set<String>>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _ExperienceSheet(initial: initial),
  );
}

class _ExperienceSheet extends StatefulWidget {
  final Set<String> initial;
  const _ExperienceSheet({required this.initial});
  @override
  State<_ExperienceSheet> createState() => _ExperienceSheetState();
}

class _ExperienceSheetState extends State<_ExperienceSheet> {
  late Set<String> _picked;
  @override
  void initState() {
    super.initState();
    _picked = {...widget.initial};
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Experience',
      onApply: () => Navigator.of(context).pop(_picked),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: _experienceOptions
              .map((o) => _CheckRow(
                    label: o,
                    selected: _picked.contains(o),
                    onTap: () => setState(() {
                      if (_picked.contains(o)) {
                        _picked.remove(o);
                      } else {
                        _picked.add(o);
                      }
                    }),
                  ))
              .toList(),
        ),
      ),
    );
  }
}

// ─── Rating ─────────────────────────────────────────────────────────────

const _ratingOptions = [
  '4.5★ and above',
  '4.0★ – 4.5★',
  '3.5★ – 4.0★',
  '3.0★ – 3.5★',
];

Future<Set<String>?> showRatingSheet(
    BuildContext context, Set<String> initial) {
  return showModalBottomSheet<Set<String>>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _RatingSheet(initial: initial),
  );
}

class _RatingSheet extends StatefulWidget {
  final Set<String> initial;
  const _RatingSheet({required this.initial});
  @override
  State<_RatingSheet> createState() => _RatingSheetState();
}

class _RatingSheetState extends State<_RatingSheet> {
  late Set<String> _picked;
  @override
  void initState() {
    super.initState();
    _picked = {...widget.initial};
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Rating',
      onApply: () => Navigator.of(context).pop(_picked),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: _ratingOptions
              .map((o) => _CheckRow(
                    label: o,
                    selected: _picked.contains(o),
                    onTap: () => setState(() {
                      if (_picked.contains(o)) {
                        _picked.remove(o);
                      } else {
                        _picked.add(o);
                      }
                    }),
                  ))
              .toList(),
        ),
      ),
    );
  }
}

// ─── Date ───────────────────────────────────────────────────────────────

Future<DateTime?> showDateFilterSheet(BuildContext context, DateTime? initial) {
  return showModalBottomSheet<DateTime>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _DateSheet(initial: initial),
  );
}

class _DateSheet extends StatefulWidget {
  final DateTime? initial;
  const _DateSheet({this.initial});
  @override
  State<_DateSheet> createState() => _DateSheetState();
}

class _DateSheetState extends State<_DateSheet> {
  late DateTime _focused;
  DateTime? _selected;
  @override
  void initState() {
    super.initState();
    _focused = widget.initial ?? DateTime.now();
    _selected = widget.initial;
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Select Date',
      onApply: () => Navigator.of(context).pop(_selected),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TableCalendar(
              firstDay: DateTime.now().subtract(const Duration(days: 1)),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _focused,
              selectedDayPredicate: (d) => isSameDay(_selected, d),
              onDaySelected: (sel, foc) => setState(() {
                _selected = sel;
                _focused = foc;
              }),
              calendarFormat: CalendarFormat.month,
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
                titleTextStyle: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600),
                leftChevronIcon: Icon(LucideIcons.chevronLeft,
                    color: Colors.white, size: 18),
                rightChevronIcon: Icon(LucideIcons.chevronRight,
                    color: Colors.white, size: 18),
              ),
              daysOfWeekStyle: DaysOfWeekStyle(
                weekdayStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 11),
                weekendStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 11),
              ),
              calendarStyle: CalendarStyle(
                outsideDaysVisible: false,
                defaultTextStyle:
                    const TextStyle(color: Colors.white, fontSize: 13),
                weekendTextStyle:
                    const TextStyle(color: Colors.white, fontSize: 13),
                selectedDecoration: const BoxDecoration(
                  color: Color(0xFFCAE96A),
                  shape: BoxShape.circle,
                ),
                selectedTextStyle: const TextStyle(
                    color: Colors.black,
                    fontSize: 13,
                    fontWeight: FontWeight.w700),
                todayDecoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  Expanded(
                    child: _PillChip(
                      label: 'Today',
                      onTap: () => setState(() {
                        _selected = DateTime.now();
                        _focused = DateTime.now();
                      }),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PillChip(
                      label: 'Tomorrow',
                      onTap: () => setState(() {
                        _selected = DateTime.now().add(const Duration(days: 1));
                        _focused = _selected!;
                      }),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Distance ───────────────────────────────────────────────────────────

Future<double?> showDistanceSheet(BuildContext context, double initial) {
  return showModalBottomSheet<double>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _DistanceSheet(initial: initial),
  );
}

class _DistanceSheet extends StatefulWidget {
  final double initial;
  const _DistanceSheet({required this.initial});
  @override
  State<_DistanceSheet> createState() => _DistanceSheetState();
}

class _DistanceSheetState extends State<_DistanceSheet> {
  late double _km;
  @override
  void initState() {
    super.initState();
    _km = widget.initial.clamp(0, 20);
  }

  @override
  Widget build(BuildContext context) {
    return _SheetShell(
      title: 'Distance',
      onApply: () => Navigator.of(context).pop(_km),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('0-20 km',
                    style: TextStyle(color: Colors.white, fontSize: 13)),
                Text(_km.toStringAsFixed(0).padLeft(2, '0'),
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 8),
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: const Color(0xFFCAE96A),
                inactiveTrackColor: Colors.white24,
                thumbColor: const Color(0xFFCAE96A),
                overlayColor: const Color(0xFFCAE96A).withValues(alpha: 0.15),
              ),
              child: Slider(
                value: _km,
                min: 0,
                max: 20,
                onChanged: (v) => setState(() => _km = v),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _PillChip(
                    label: 'Within 2 km', onTap: () => setState(() => _km = 2)),
                _PillChip(label: '5 km', onTap: () => setState(() => _km = 5)),
                _PillChip(
                    label: '10 km', onTap: () => setState(() => _km = 10)),
                _PillChip(
                    label: 'Any Distance',
                    onTap: () => setState(() => _km = 20)),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

// ─── Shared row widgets ─────────────────────────────────────────────────

class _CheckRow extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _CheckRow({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Expanded(
              child: Text(label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontFamily: 'Poppins')),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: selected ? const Color(0xFFCAE96A) : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: selected
                      ? const Color(0xFFCAE96A)
                      : Colors.white.withValues(alpha: 0.5),
                  width: 1.5,
                ),
              ),
              child: selected
                  ? const Icon(LucideIcons.check, color: Colors.black, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _PillChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _PillChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2C),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins')),
      ),
    );
  }
}
