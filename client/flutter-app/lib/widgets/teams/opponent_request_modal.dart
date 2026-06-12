import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/app_colors.dart';
import '../../core/util/image_url.dart';
import '../../models/team_opponent_request_model.dart';
import '../../services/team_service.dart';

class OpponentRequestModal extends StatefulWidget {
  final TeamOpponentRequestModel request;
  final VoidCallback onHandled;

  const OpponentRequestModal({
    super.key,
    required this.request,
    required this.onHandled,
  });

  @override
  State<OpponentRequestModal> createState() => _OpponentRequestModalState();
}

class _OpponentRequestModalState extends State<OpponentRequestModal> {
  bool _loading = false;

  Future<void> _handle(bool accept) async {
    setState(() => _loading = true);
    try {
      await TeamService().handleOpponentRequest(widget.request.id, accept);
      if (mounted) context.pop();
      widget.onHandled();
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final challenger = widget.request.teamA;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: AppColors.surfaceL1,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Challenge Request',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 20),
          if (challenger != null) ...[
            Builder(builder: (_) {
              final avatarUrl = safeAvatarUrl(challenger.imageUrl);
              return CircleAvatar(
                radius: 36,
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                backgroundImage: avatarUrl != null
                    ? CachedNetworkImageProvider(avatarUrl)
                    : null,
                child: avatarUrl == null
                    ? Text(
                        challenger.name.isNotEmpty
                            ? challenger.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    : null,
              );
            }),
            const SizedBox(height: 12),
            Text(
              challenger.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                fontFamily: 'Poppins',
              ),
            ),
            Text(
              '${challenger.sportType}'
              '${challenger.city != null ? ' · ${challenger.city}' : ''}',
              style:
                  const TextStyle(color: Colors.white54, fontFamily: 'Poppins'),
            ),
            const SizedBox(height: 8),
            Text(
              '${challenger.members.length} members',
              style: const TextStyle(
                  color: Colors.white38, fontSize: 13, fontFamily: 'Poppins'),
            ),
          ],
          const SizedBox(height: 28),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading ? null : () => _handle(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Decline',
                      style: TextStyle(
                          fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _handle(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(
                          color: Colors.black, strokeWidth: 2)
                      : const Text(
                          'Accept!',
                          style: TextStyle(
                            color: Colors.black,
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
