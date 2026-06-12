import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/util/image_url.dart';
import '../../providers/team_provider.dart';
import '../../services/team_service.dart';
import '../../services/user_service.dart';
import 'contact_picker_sheet.dart';

class InviteMemberModal extends ConsumerStatefulWidget {
  final String teamId;
  final VoidCallback onSuccess;

  const InviteMemberModal({
    super.key,
    required this.teamId,
    required this.onSuccess,
  });

  @override
  ConsumerState<InviteMemberModal> createState() => _InviteMemberModalState();
}

class _InviteMemberModalState extends ConsumerState<InviteMemberModal>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  final _searchCtrl = TextEditingController();
  final _customNameCtrl = TextEditingController();
  final _customPhoneCtrl = TextEditingController();

  List<Map<String, dynamic>> _searchResults = [];
  final Set<String> _selectedUserIds = {};
  // Cache of user-id → display map so the "N selected" chip can stay accurate
  // even after the user clears the search field (which empties _searchResults).
  final Map<String, Map<String, dynamic>> _selectedUserCache = {};
  bool _searching = false;
  bool _inviting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _searchCtrl.dispose();
    _customNameCtrl.dispose();
    _customPhoneCtrl.dispose();
    super.dispose();
  }

  /// Last query the user typed. Used to drop stale responses when the
  /// user types fast — a slower request landing after a newer one would
  /// otherwise repopulate `_searchResults` with the wrong list.
  String _activeQuery = '';

  Future<void> _search(String query) async {
    final trimmed = query.trim();
    _activeQuery = trimmed;
    if (trimmed.isEmpty) {
      setState(() {
        _searchResults = [];
        _searching = false;
      });
      return;
    }
    setState(() => _searching = true);
    try {
      final results = await UserService().searchPlayers(trimmed);
      if (!mounted || _activeQuery != trimmed) return;
      setState(() {
        _searchResults = results;
        _searching = false;
      });
    } catch (_) {
      if (!mounted || _activeQuery != trimmed) return;
      setState(() => _searching = false);
    }
  }

  void _toast(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.accentRed : AppColors.accentGreen,
      duration: const Duration(seconds: 3),
    ));
  }

  void _toggleSelectUser(Map<String, dynamic> user) {
    final id = (user['_id'] ?? user['id'] ?? '').toString();
    if (id.isEmpty) return;
    setState(() {
      if (_selectedUserIds.contains(id)) {
        _selectedUserIds.remove(id);
        _selectedUserCache.remove(id);
      } else {
        _selectedUserIds.add(id);
        _selectedUserCache[id] = user;
      }
    });
  }

  Future<void> _inviteSelectedUsers() async {
    if (_selectedUserIds.isEmpty) return;
    setState(() {
      _inviting = true;
      _error = null;
    });
    try {
      await TeamService().inviteMember(widget.teamId, {
        'invitees': _selectedUserIds.map((id) => {'userId': id}).toList(),
      });
      ref.invalidate(teamDetailProvider(widget.teamId));
      if (!mounted) return;
      final n = _selectedUserIds.length;
      setState(() => _inviting = false);
      _toast(n == 1 ? 'Invite sent' : 'Sent $n invites');
      context.pop();
      widget.onSuccess();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _inviting = false;
        _error = 'Failed to invite. Try again.';
      });
      _toast('Failed to invite. Try again.', isError: true);
    }
  }

  Future<void> _inviteCustom() async {
    if (_customNameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Name is required');
      return;
    }
    setState(() {
      _inviting = true;
      _error = null;
    });
    try {
      await TeamService().inviteMember(widget.teamId, {
        'invitees': [
          {
            'name': _customNameCtrl.text.trim(),
            if (_customPhoneCtrl.text.trim().isNotEmpty)
              'phone': _customPhoneCtrl.text.trim(),
          },
        ],
      });
      ref.invalidate(teamDetailProvider(widget.teamId));
      if (!mounted) return;
      setState(() => _inviting = false);
      _toast('Invite sent');
      context.pop();
      widget.onSuccess();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _inviting = false;
        _error = 'Failed to invite. Try again.';
      });
      _toast('Failed to invite. Try again.', isError: true);
    }
  }

  Future<void> _pickFromContacts() async {
    final picked = await showModalBottomSheet<List<PickedContact>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ContactPickerSheet(),
    );
    if (!mounted || picked == null || picked.isEmpty) return;

    if (picked.length == 1) {
      // Single contact: prefill the form so the user can review before adding.
      final c = picked.first;
      setState(() {
        _customNameCtrl.text = c.name;
        _customPhoneCtrl.text = c.phone;
        _error = null;
      });
      return;
    }

    // Multiple contacts: send them all in one batch invite.
    setState(() {
      _inviting = true;
      _error = null;
    });
    try {
      await TeamService().inviteMember(widget.teamId, {
        'invitees':
            picked.map((c) => {'name': c.name, 'phone': c.phone}).toList(),
      });
      ref.invalidate(teamDetailProvider(widget.teamId));
      if (!mounted) return;
      setState(() => _inviting = false);
      _toast('Added ${picked.length} contacts');
      context.pop();
      widget.onSuccess();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _inviting = false;
        _error = 'Failed to add contacts. Try again.';
      });
      _toast('Failed to add contacts. Try again.', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    // Take more height as a baseline AND shrink by the keyboard inset so
    // search results stay visible above the keyboard instead of being hidden.
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
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Invite Member',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TabBar(
            controller: _tabs,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: Colors.white38,
            labelStyle: const TextStyle(
                fontFamily: 'Poppins', fontWeight: FontWeight.w600),
            tabs: const [
              Tab(text: 'Search Users'),
              Tab(text: 'Add Custom'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabs,
              children: [_searchTab(), _customTab()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _searchTab() {
    final selectedCount = _selectedUserIds.length;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchCtrl,
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
            decoration: InputDecoration(
              hintText: 'Search by username or email',
              hintStyle:
                  const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
              prefixIcon: const Icon(LucideIcons.search, color: Colors.white38),
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
            onChanged: _search,
          ),
          if (selectedCount > 0)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(
                children: [
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
                  const Spacer(),
                  TextButton(
                    onPressed: () => setState(() {
                      _selectedUserIds.clear();
                      _selectedUserCache.clear();
                    }),
                    child: const Text('Clear',
                        style: TextStyle(
                            color: Colors.white54, fontFamily: 'Poppins')),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          if (_searching)
            const CircularProgressIndicator(color: AppColors.primary),
          if (!_searching &&
              _searchCtrl.text.trim().isEmpty &&
              selectedCount == 0)
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: Text(
                'Type a name, username, or email to find players. Tap each one to add — you can pick multiple.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 13,
                    fontFamily: 'Poppins'),
              ),
            )
          else if (!_searching &&
              _searchCtrl.text.trim().isNotEmpty &&
              _searchResults.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: Column(
                children: [
                  Text(
                    'No players matched "${_searchCtrl.text.trim()}".',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontFamily: 'Poppins'),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Try a different spelling, or use Add Custom for a guest.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 12,
                        fontFamily: 'Poppins'),
                  ),
                ],
              ),
            ),
          Expanded(
            child: ListView.builder(
              itemCount: _searchResults.length,
              itemBuilder: (_, i) {
                final user = _searchResults[i];
                final id = (user['_id'] ?? user['id'] ?? '').toString();
                // Backend uses `name` + `profilePicture`; keep legacy keys
                // as fallbacks just in case.
                final name = (user['name'] ??
                        [user['firstName'], user['lastName']]
                            .where((p) => p != null && p.toString().isNotEmpty)
                            .join(' '))
                    .toString()
                    .trim();
                final photo = (user['profilePicture'] ?? user['profilePhoto'])
                    ?.toString();
                final photoUrl = safeAvatarUrl(photo);
                final subtitle = (user['username'] != null
                        ? '@${user['username']}'
                        : (user['email']?.toString() ?? ''))
                    .toString();
                final selected = _selectedUserIds.contains(id);
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                    backgroundImage:
                        photoUrl != null ? NetworkImage(photoUrl) : null,
                    child: photoUrl == null
                        ? Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(color: AppColors.primary),
                          )
                        : null,
                  ),
                  title: Text(name.isEmpty ? 'Player' : name,
                      style: const TextStyle(
                          color: Colors.white, fontFamily: 'Poppins')),
                  subtitle: Text(subtitle,
                      style: const TextStyle(color: Colors.white38)),
                  trailing: _SelectDot(selected: selected),
                  onTap: () => _toggleSelectUser(user),
                );
              },
            ),
          ),
          if (selectedCount > 0)
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _inviting ? null : _inviteSelectedUsers,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _inviting
                        ? const CircularProgressIndicator(
                            color: Colors.black, strokeWidth: 2)
                        : Text(
                            selectedCount == 1
                                ? 'Invite 1 Player'
                                : 'Invite $selectedCount Players',
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

  Widget _customTab() {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _inviting ? null : _pickFromContacts,
                icon: const Icon(LucideIcons.contact, color: AppColors.primary),
                label: const Text(
                  'Pick from Contacts',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontFamily: 'Poppins',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(
                      color: AppColors.primary.withValues(alpha: 0.5)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Expanded(child: Divider(color: Colors.white12)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'or add manually',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.45),
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                const Expanded(child: Divider(color: Colors.white12)),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _customNameCtrl,
              style:
                  const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
              decoration: _inputDec('Full Name *'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _customPhoneCtrl,
              keyboardType: TextInputType.phone,
              style:
                  const TextStyle(color: Colors.white, fontFamily: 'Poppins'),
              decoration: _inputDec('Phone Number (optional)'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style:
                      const TextStyle(color: Colors.redAccent, fontSize: 13)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _inviting ? null : _inviteCustom,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: _inviting
                    ? const CircularProgressIndicator(
                        color: Colors.black, strokeWidth: 2)
                    : const Text(
                        'Add Player',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Poppins',
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDec(String hint) => InputDecoration(
        hintText: hint,
        hintStyle:
            const TextStyle(color: Colors.white38, fontFamily: 'Poppins'),
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
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      );
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
