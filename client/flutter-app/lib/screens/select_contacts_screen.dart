import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../services/friends_service.dart';

class SelectContactsScreen extends StatefulWidget {
  const SelectContactsScreen({Key? key}) : super(key: key);

  @override
  State<SelectContactsScreen> createState() => _SelectContactsScreenState();
}

class _SelectContactsScreenState extends State<SelectContactsScreen> {
  final FriendsService _friendsService = FriendsService();
  final TextEditingController _searchCtrl = TextEditingController();

  List<Map<String, dynamic>> _friends = [];
  List<Map<String, dynamic>> _filtered = [];
  final Set<String> _selectedIds = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFriends();
    _searchCtrl.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadFriends() async {
    final list = await _friendsService.getFollowingList();
    setState(() {
      _friends = list;
      _filtered = list;
      _isLoading = false;
    });
  }

  void _onSearch() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? _friends
          : _friends.where((f) {
              final name = (f['name'] ?? '').toLowerCase();
              return name.contains(q);
            }).toList();
    });
  }

  void _toggle(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _onNext() {
    if (_selectedIds.isEmpty) return;
    final selected = _friends
        .where((f) => _selectedIds.contains(f['id']?.toString() ?? ''))
        .toList();
    context.push('/create-group', extra: {'selected': selected});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceL0,
      body: SafeArea(
        child: Column(
          children: [
            // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Text(
                    'Select Contacts',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(LucideIcons.x,
                          color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.surfaceL3,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 14),
                    const Icon(LucideIcons.search,
                        color: AppColors.textDarkGray, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _searchCtrl,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Search',
                          hintStyle: TextStyle(
                              color: AppColors.textGray, fontSize: 14),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 8),

            // â”€â”€ Contacts list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Expanded(
              child: _isLoading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppColors.primary))
                  : _filtered.isEmpty
                      ? const Center(
                          child: Text(
                            'No contacts found',
                            style: TextStyle(
                                color: AppColors.textGray, fontSize: 14),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(top: 6),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final f = _filtered[i];
                            final id = f['id']?.toString() ?? '';
                            final name = f['name']?.toString() ?? 'Unknown';
                            final photo = f['profilePicture']?.toString();
                            final isSelected = _selectedIds.contains(id);
                            return _ContactTile(
                              name: name,
                              photoUrl: photo,
                              isSelected: isSelected,
                              onTap: () => _toggle(id),
                            );
                          },
                        ),
            ),

            // â”€â”€ Next button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: GestureDetector(
                onTap: _selectedIds.isNotEmpty ? _onNext : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: double.infinity,
                  height: 52,
                  decoration: BoxDecoration(
                    color: _selectedIds.isNotEmpty
                        ? AppColors.primary
                        : AppColors.primary.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Text(
                      'Next',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€ Contact Tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class _ContactTile extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final bool isSelected;
  final VoidCallback onTap;

  const _ContactTile({
    required this.name,
    required this.photoUrl,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFF5EDD8),
              ),
              child: ClipOval(
                child: photoUrl != null && photoUrl!.isNotEmpty
                    ? Image.network(photoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _defaultAvatar())
                    : _defaultAvatar(),
              ),
            ),

            const SizedBox(width: 14),

            // Name
            Expanded(
              child: Text(
                name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            // Selection indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.textGray,
                  width: 1.5,
                ),
              ),
              child: isSelected
                  ? const Icon(LucideIcons.check, color: Colors.black, size: 13)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _defaultAvatar() => Container(
        color: AppColors.backgroundCard,
        child:
            const Icon(LucideIcons.user, color: AppColors.textGray, size: 28),
      );
}
