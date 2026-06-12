import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';

class PickedContact {
  final String name;
  final String phone;
  const PickedContact({required this.name, required this.phone});
}

/// Bottom sheet that loads phone-book contacts and lets the user pick one or
/// more. Returns a `List<PickedContact>` via `Navigator.pop`, or `null` on
/// cancel. Single-select is just a list of length 1.
///
/// Permission is requested lazily. Contacts without phone numbers are hidden
/// — the invite flow needs a phone, and nameless rows just make the list noisy.
class ContactPickerSheet extends StatefulWidget {
  const ContactPickerSheet({super.key});

  @override
  State<ContactPickerSheet> createState() => _ContactPickerSheetState();
}

class _ContactPickerSheetState extends State<ContactPickerSheet> {
  final _searchCtrl = TextEditingController();
  List<Contact> _all = [];
  List<Contact> _filtered = [];
  final Set<String> _selectedIds = {};
  bool _loading = true;
  bool _permissionDenied = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final granted = await FlutterContacts.requestPermission(readonly: true);
      if (!mounted) return;
      if (!granted) {
        setState(() {
          _permissionDenied = true;
          _loading = false;
        });
        return;
      }
      final contacts = await FlutterContacts.getContacts(
        withProperties: true,
        sorted: true,
      );
      if (!mounted) return;
      final withPhone = contacts.where((c) => c.phones.isNotEmpty).toList();
      setState(() {
        _all = withPhone;
        _filtered = withPhone;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load contacts.';
      });
      if (kDebugMode) {
        debugPrint('ContactPickerSheet: $e');
      }
    }
  }

  void _onSearch(String q) {
    final query = q.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() => _filtered = _all);
      return;
    }
    setState(() {
      _filtered = _all.where((c) {
        if (c.displayName.toLowerCase().contains(query)) return true;
        return c.phones
            .any((p) => p.number.replaceAll(' ', '').contains(query));
      }).toList();
    });
  }

  void _toggle(Contact c) {
    setState(() {
      if (_selectedIds.contains(c.id)) {
        _selectedIds.remove(c.id);
      } else {
        _selectedIds.add(c.id);
      }
    });
  }

  void _confirm() {
    final picked = _all.where((c) => _selectedIds.contains(c.id)).map((c) {
      final phone = c.phones.first.number.trim();
      final name = c.displayName.trim().isNotEmpty
          ? c.displayName.trim()
          : (phone.isNotEmpty ? phone : 'Player');
      return PickedContact(name: name, phone: phone);
    }).toList();
    context.pop(picked);
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final selectedCount = _selectedIds.length;
    return Container(
      height: mq.size.height * 0.9 - mq.viewInsets.bottom,
      decoration: const BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Pick from Contacts',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                if (selectedCount > 0)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '$selectedCount selected',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchCtrl,
              style:
                  const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
              decoration: InputDecoration(
                hintText: 'Search name or number',
                hintStyle: const TextStyle(
                    color: Colors.white38, fontFamily: 'Poppins'),
                prefixIcon:
                    const Icon(LucideIcons.search, color: Colors.white38),
                filled: true,
                fillColor: AppColors.surfaceL3,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
              ),
              onChanged: _onSearch,
            ),
          ),
          const SizedBox(height: 8),
          Expanded(child: _body()),
          if (selectedCount > 0)
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _confirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      selectedCount == 1
                          ? 'Add 1 Contact'
                          : 'Add $selectedCount Contacts',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_permissionDenied) {
      return _emptyState(
        icon: LucideIcons.lock,
        title: 'Contacts permission denied',
        subtitle:
            'Enable Contacts access for Kridaz in your device settings to pick a teammate from your phone book.',
        action: TextButton(
          onPressed: _load,
          child: const Text('Try again',
              style: TextStyle(color: AppColors.primary)),
        ),
      );
    }
    if (_error != null) {
      return _emptyState(
        icon: LucideIcons.alertCircle,
        title: 'Could not load contacts',
        subtitle: _error!,
        action: TextButton(
          onPressed: _load,
          child: const Text('Try again',
              style: TextStyle(color: AppColors.primary)),
        ),
      );
    }
    if (_filtered.isEmpty) {
      return _emptyState(
        icon: LucideIcons.users,
        title: 'No contacts found',
        subtitle: _all.isEmpty
            ? 'You have no contacts with phone numbers.'
            : 'No contacts match your search.',
      );
    }
    return ListView.builder(
      itemCount: _filtered.length,
      itemBuilder: (_, i) {
        final c = _filtered[i];
        final phone = c.phones.first.number;
        final name = c.displayName.trim().isNotEmpty ? c.displayName : phone;
        final selected = _selectedIds.contains(c.id);
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          title: Text(
            name,
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
          ),
          subtitle: Text(
            phone,
            style:
                const TextStyle(color: Colors.white54, fontFamily: 'Poppins'),
          ),
          trailing: _SelectDot(selected: selected),
          onTap: () => _toggle(c),
        );
      },
    );
  }

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? action,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white38, size: 40),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 13,
                fontFamily: 'Poppins',
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: 12),
              action,
            ],
          ],
        ),
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
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: selected ? AppColors.primary : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? AppColors.primary : Colors.white38,
          width: 2,
        ),
      ),
      child: selected
          ? const Icon(LucideIcons.check, size: 14, color: Colors.black)
          : null,
    );
  }
}
