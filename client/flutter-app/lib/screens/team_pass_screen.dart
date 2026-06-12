import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../widgets/common/bms_toast.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/team_provider.dart';

class TeamPassScreen extends ConsumerStatefulWidget {
  final String teamId;

  const TeamPassScreen({super.key, required this.teamId});

  @override
  ConsumerState<TeamPassScreen> createState() => _TeamPassScreenState();
}

class _TeamPassScreenState extends ConsumerState<TeamPassScreen> {
  final _passKey = GlobalKey();

  Future<Uint8List?> _capture() async {
    try {
      final boundary =
          _passKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final teamAsync = ref.watch(teamDetailProvider(widget.teamId));

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Team Pass',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      body: teamAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Text('$e', style: const TextStyle(color: Colors.white54)),
        ),
        data: (team) => Column(
          children: [
            Expanded(
              child: Center(
                child: RepaintBoundary(
                  key: _passKey,
                  child: Container(
                    width: 320,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceL1,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.6),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          blurRadius: 30,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'TEAM PASS',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 4,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (team.imageUrl != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.network(
                              team.imageUrl!,
                              width: 80,
                              height: 80,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  width: 80,
                                  height: 80,
                                  color:
                                      AppColors.primary.withValues(alpha: 0.15),
                                  alignment: Alignment.center,
                                  child: Icon(Icons.groups,
                                      color: AppColors.primary, size: 36),
                                );
                              },
                            ),
                          )
                        else
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              team.name.isNotEmpty
                                  ? team.name[0].toUpperCase()
                                  : '?',
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 36,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        const SizedBox(height: 14),
                        Text(
                          team.name.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          team.sportType,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontFamily: 'Poppins',
                            fontSize: 13,
                          ),
                        ),
                        if (team.captainName != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Captain: ${team.captainName}',
                            style: const TextStyle(
                                color: Colors.white54,
                                fontFamily: 'Poppins',
                                fontSize: 12),
                          ),
                        ],
                        if (team.city != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            team.city!,
                            style: const TextStyle(
                                color: Colors.white38,
                                fontFamily: 'Poppins',
                                fontSize: 12),
                          ),
                        ],
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: QrImageView(
                            data: team.teamCode,
                            version: QrVersions.auto,
                            size: 140,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          team.teamCode,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Poppins',
                            letterSpacing: 3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Team Code',
                          style: TextStyle(
                              color: Colors.white38,
                              fontSize: 11,
                              fontFamily: 'Poppins'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final bytes = await _capture();
                        if (bytes == null) return;
                        final dir = await getTemporaryDirectory();
                        final file =
                            File('${dir.path}/team_pass_${team.teamCode}.png');
                        await file.writeAsBytes(bytes);
                        await Share.shareXFiles(
                          [XFile(file.path)],
                          text:
                              'Join my team ${team.name} on BMS! Code: ${team.teamCode}',
                        );
                      },
                      icon: const Icon(LucideIcons.share2,
                          color: AppColors.primary),
                      label: const Text('Share',
                          style: TextStyle(
                              color: AppColors.primary, fontFamily: 'Poppins')),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final bytes = await _capture();
                        if (bytes == null) return;
                        final dir = await getTemporaryDirectory();
                        final file =
                            File('${dir.path}/team_pass_${team.teamCode}.png');
                        await file.writeAsBytes(bytes);
                        if (context.mounted) {
                          BmsToast.success(context, 'Team Pass saved!');
                        }
                      },
                      icon: const Icon(Icons.download_outlined,
                          color: Colors.black),
                      label: const Text('Download',
                          style: TextStyle(
                            color: Colors.black,
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w600,
                          )),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
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
