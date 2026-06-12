import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../widgets/common/bms_toast.dart';

class TournamentCreateScreen extends StatefulWidget {
  const TournamentCreateScreen({Key? key}) : super(key: key);

  @override
  State<TournamentCreateScreen> createState() => _TournamentCreateScreenState();
}

class _TournamentCreateScreenState extends State<TournamentCreateScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Form state
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _prizeController = TextEditingController();
  final _entryFeeController = TextEditingController();
  final _teamsController = TextEditingController();

  String _selectedSport = 'Cricket';
  String _selectedFormat = 'Knockout';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isPublic = true;

  static const List<String> _sports = [
    'Cricket',
    'Football',
    'Tennis',
    'Badminton',
    'Basketball'
  ];
  static const List<String> _formats = [
    'Knockout',
    'League',
    'Round Robin',
    'Swiss'
  ];

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _locationController.dispose();
    _prizeController.dispose();
    _entryFeeController.dispose();
    _teamsController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentPage++);
    } else {
      _submit();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentPage--);
    }
  }

  void _submit() {
    BmsToast.info(context, 'Tournament creation coming soon!');
    context.pop();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.accentYellow,
            surface: AppColors.backgroundCard,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  String _fmt(DateTime? d) =>
      d == null ? 'Select date' : '${d.day}/${d.month}/${d.year}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Create Tournament',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      body: Column(
        children: [
          // Progress indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: List.generate(3, (i) {
                return Expanded(
                  child: Container(
                    height: 4,
                    margin: EdgeInsets.only(right: i < 2 ? 6 : 0),
                    decoration: BoxDecoration(
                      color: i <= _currentPage
                          ? AppColors.accentYellow
                          : Colors.white12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  'Step ${_currentPage + 1} of 3',
                  style: const TextStyle(
                    color: AppColors.textDarkGray,
                    fontSize: 12,
                    fontFamily: 'Poppins',
                  ),
                ),
                const Spacer(),
                Text(
                  ['Basic Info', 'Schedule & Rules', 'Review'][_currentPage],
                  style: const TextStyle(
                    color: AppColors.accentYellow,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _Step1(
                  nameController: _nameController,
                  locationController: _locationController,
                  selectedSport: _selectedSport,
                  sports: _sports,
                  onSportChanged: (v) => setState(() => _selectedSport = v),
                ),
                _Step2(
                  selectedFormat: _selectedFormat,
                  formats: _formats,
                  onFormatChanged: (v) => setState(() => _selectedFormat = v),
                  startDateLabel: _fmt(_startDate),
                  endDateLabel: _fmt(_endDate),
                  onPickStart: () => _pickDate(isStart: true),
                  onPickEnd: () => _pickDate(isStart: false),
                  teamsController: _teamsController,
                  prizeController: _prizeController,
                  entryFeeController: _entryFeeController,
                  isPublic: _isPublic,
                  onPublicToggle: (v) => setState(() => _isPublic = v),
                ),
                _Step3(
                  name: _nameController.text,
                  sport: _selectedSport,
                  format: _selectedFormat,
                  location: _locationController.text,
                  startDate: _fmt(_startDate),
                  endDate: _fmt(_endDate),
                  teams: _teamsController.text,
                  prize: _prizeController.text,
                  entry: _entryFeeController.text,
                  isPublic: _isPublic,
                ),
              ],
            ),
          ),

          // Navigation buttons
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  if (_currentPage > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _prevPage,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white24),
                          minimumSize: const Size.fromHeight(50),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text(
                          'Back',
                          style: TextStyle(
                            color: Colors.white70,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ),
                    ),
                  if (_currentPage > 0) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentYellow,
                        foregroundColor: Colors.black,
                        minimumSize: const Size.fromHeight(50),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: Text(
                        _currentPage < 2 ? 'Next' : 'Create Tournament',
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                          fontSize: 15,
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

// â”€â”€ Step 1: Basic Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Step1 extends StatelessWidget {
  final TextEditingController nameController;
  final TextEditingController locationController;
  final String selectedSport;
  final List<String> sports;
  final ValueChanged<String> onSportChanged;

  const _Step1({
    required this.nameController,
    required this.locationController,
    required this.selectedSport,
    required this.sports,
    required this.onSportChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label('Tournament Name'),
          _field(nameController, 'e.g. City Cricket League 2026'),
          const SizedBox(height: 16),
          _label('Location / Venue'),
          _field(locationController, 'e.g. Gachibowli, Hyderabad'),
          const SizedBox(height: 16),
          _label('Sport'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: sports.map((s) {
              final sel = selectedSport == s;
              return GestureDetector(
                onTap: () => onSportChanged(s),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color:
                        sel ? AppColors.accentYellow : AppColors.backgroundCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: sel ? AppColors.accentYellow : Colors.white12,
                    ),
                  ),
                  child: Text(
                    s,
                    style: TextStyle(
                      color: sel ? Colors.black : Colors.white70,
                      fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Step 2: Schedule & Rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Step2 extends StatelessWidget {
  final String selectedFormat;
  final List<String> formats;
  final ValueChanged<String> onFormatChanged;
  final String startDateLabel, endDateLabel;
  final VoidCallback onPickStart, onPickEnd;
  final TextEditingController teamsController;
  final TextEditingController prizeController;
  final TextEditingController entryFeeController;
  final bool isPublic;
  final ValueChanged<bool> onPublicToggle;

  const _Step2({
    required this.selectedFormat,
    required this.formats,
    required this.onFormatChanged,
    required this.startDateLabel,
    required this.endDateLabel,
    required this.onPickStart,
    required this.onPickEnd,
    required this.teamsController,
    required this.prizeController,
    required this.entryFeeController,
    required this.isPublic,
    required this.onPublicToggle,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label('Format'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: formats.map((f) {
              final sel = selectedFormat == f;
              return GestureDetector(
                onTap: () => onFormatChanged(f),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color:
                        sel ? AppColors.accentYellow : AppColors.backgroundCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: sel ? AppColors.accentYellow : Colors.white12,
                    ),
                  ),
                  child: Text(
                    f,
                    style: TextStyle(
                      color: sel ? Colors.black : Colors.white70,
                      fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                  child:
                      _dateButton('Start Date', startDateLabel, onPickStart)),
              const SizedBox(width: 10),
              Expanded(child: _dateButton('End Date', endDateLabel, onPickEnd)),
            ],
          ),
          const SizedBox(height: 16),
          _label('Max Teams'),
          _field(teamsController, 'e.g. 16',
              keyboardType: TextInputType.number),
          const SizedBox(height: 16),
          _label('Prize Pool (₹)'),
          _field(prizeController, 'e.g. 10000',
              keyboardType: TextInputType.number),
          const SizedBox(height: 16),
          _label('Entry Fee (₹)'),
          _field(entryFeeController, 'e.g. 500',
              keyboardType: TextInputType.number),
          const SizedBox(height: 16),
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Public Tournament',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    Text(
                      'Anyone can discover and join',
                      style: TextStyle(
                        color: AppColors.textDarkGray,
                        fontSize: 12,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isPublic,
                onChanged: onPublicToggle,
                activeColor: AppColors.accentYellow,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dateButton(String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textDarkGray,
                fontSize: 11,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(LucideIcons.calendar,
                    color: AppColors.accentYellow, size: 14),
                const SizedBox(width: 6),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Step 3: Review â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Step3 extends StatelessWidget {
  final String name, sport, format, location;
  final String startDate, endDate, teams, prize, entry;
  final bool isPublic;

  const _Step3({
    required this.name,
    required this.sport,
    required this.format,
    required this.location,
    required this.startDate,
    required this.endDate,
    required this.teams,
    required this.prize,
    required this.entry,
    required this.isPublic,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Review your tournament',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 16),
          _reviewTile('Name', name.isEmpty ? '—' : name),
          _reviewTile('Sport', sport),
          _reviewTile('Format', format),
          _reviewTile('Location', location.isEmpty ? '—' : location),
          _reviewTile('Start Date', startDate),
          _reviewTile('End Date', endDate),
          _reviewTile('Max Teams', teams.isEmpty ? '—' : teams),
          _reviewTile('Prize Pool', prize.isEmpty ? '—' : '₹$prize'),
          _reviewTile('Entry Fee', entry.isEmpty ? '—' : '₹$entry'),
          _reviewTile('Visibility', isPublic ? 'Public' : 'Private'),
        ],
      ),
    );
  }

  Widget _reviewTile(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textDarkGray,
              fontSize: 13,
              fontFamily: 'Poppins',
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              fontFamily: 'Poppins',
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

Widget _label(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 13,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins',
        ),
      ),
    );

Widget _field(
  TextEditingController controller,
  String hint, {
  TextInputType keyboardType = TextInputType.text,
}) =>
    Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white12),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(
            color: Colors.white, fontFamily: 'Poppins', fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
              color: Colors.white24, fontFamily: 'Poppins', fontSize: 13),
          border: InputBorder.none,
        ),
      ),
    );
