import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import '../core/constants/app_colors.dart';
import 'package:go_router/go_router.dart';

class GameDetailsScreen extends StatefulWidget {
  final String? gameId;
  final String? sport;
  final String? location;
  final DateTime? date;
  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final int? playerCount;
  final double? playerShare;
  final bool isFreeGame;
  final bool isFriendly;
  final bool isPublic;

  const GameDetailsScreen({
    Key? key,
    this.gameId,
    this.sport,
    this.location,
    this.date,
    this.startTime,
    this.endTime,
    this.playerCount,
    this.playerShare,
    this.isFreeGame = false,
    this.isFriendly = true,
    this.isPublic = true,
  }) : super(key: key);

  @override
  State<GameDetailsScreen> createState() => _GameDetailsScreenState();
}

class _GameDetailsScreenState extends State<GameDetailsScreen> {
  int joinedPlayers = 8; // Mock data

  String _formatDate() {
    if (widget.date == null) return 'Date not set';
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    final days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    final date = widget.date;
    if (date == null) return 'Date not set';
    return '${days[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}';
  }

  String _formatTime() {
    if (widget.startTime == null || widget.endTime == null)
      return 'Time not set';
    final startTime = widget.startTime;
    final endTime = widget.endTime;
    if (startTime == null || endTime == null) return 'Time not set';
    return '${startTime.format(context)} - ${endTime.format(context)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      child: const Icon(
                        LucideIcons.arrowLeft,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                  const Expanded(
                    child: Text(
                      'Game Details',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 9),

                    // Game Title
                    Text(
                      '${widget.sport ?? 'Sport'} Match',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 0),

                    // Game Info
                    Text(
                      '${widget.sport ?? 'Sport'} · ${_formatDate()} · ${_formatTime()}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textGray,
                      ),
                    ),

                    const SizedBox(height: 23),

                    // Map placeholder with location
                    Container(
                      height: 201,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL3,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.surfaceL4,
                          width: 1,
                        ),
                      ),
                      child: Stack(
                        children: [
                          // Map placeholder
                          Center(
                            child: Icon(
                              LucideIcons.map,
                              size: 60,
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          // Location overlay at bottom
                          Positioned(
                            left: 16,
                            bottom: 16,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    LucideIcons.mapPin,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    widget.location ?? 'Location not set',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 23),

                    // View Messages Button
                    InkWell(
                      onTap: () => BmsToast.info(
                          context, 'Messages feature coming soon!'),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL4,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Image.asset(
                              'assets/icons/ant_message_outlined.png',
                              width: 24,
                              height: 24,
                            ),
                            const SizedBox(width: 16),
                            const Text(
                              'View Messages',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),
                            const Spacer(),
                            const Icon(
                              LucideIcons.chevronRight,
                              color: Colors.white,
                              size: 24,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 104),

                    // Game Summary
                    const Text(
                      'Game Summary',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Host and Players Info
                    Container(
                      height: 61,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Host',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                const Text(
                                  'Sampad',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 1,
                            height: 53,
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Players',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  '$joinedPlayers/${widget.playerCount ?? 0}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Per Player Share and Game Type
                    Container(
                      height: 61,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceL4,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Per Player Share',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  widget.isFreeGame
                                      ? 'Free'
                                      : '₹${widget.playerShare?.toStringAsFixed(0) ?? '0'}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 1,
                            height: 53,
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Game Type',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  widget.isFriendly
                                      ? 'Friendly'
                                      : 'Competitive',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Manage Players
                    const Text(
                      'Manage Players',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Joined Players Button
                    InkWell(
                      onTap: () {
                        // Navigate to joined players screen
                        BmsToast.info(
                            context, 'Joined players list coming soon!');
                      },
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceL4,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: const Row(
                          children: [
                            Text(
                              'Joined Players',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.white,
                              ),
                            ),
                            Spacer(),
                            Icon(
                              LucideIcons.chevronRight,
                              color: Colors.white,
                              size: 24,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),

            // Invite Players Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    // Handle invite players action
                    BmsToast.info(
                        context, 'Invite players feature coming soon!');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.backgroundCard,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'INVITE PLAYERS',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.accentCyan,
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
