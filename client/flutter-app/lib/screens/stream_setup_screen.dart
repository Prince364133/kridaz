import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants/app_colors.dart';
import '../services/scoring_service.dart';
import '../services/streaming_service.dart';
import '../widgets/common/bms_toast.dart';
import '../widgets/common/primary_gradient_button.dart';

/// Stream Setup — connect a YouTube (or Facebook) account, pick a channel,
/// and start a live stream attached to a scoring match. Mirrors the web
/// scorer's "Go Live" flow.
class StreamSetupScreen extends StatefulWidget {
  final String matchId;
  const StreamSetupScreen({super.key, required this.matchId});

  @override
  State<StreamSetupScreen> createState() => _StreamSetupScreenState();
}

class _StreamSetupScreenState extends State<StreamSetupScreen> {
  final _streaming = StreamingService();
  final _scoring = ScoringService();
  final _titleCtrl = TextEditingController(text: 'Live Match');

  String _platform = 'youtube';
  List<Map<String, dynamic>> _accounts = const [];
  String? _selectedChannelId;
  bool _loading = false;
  Map<String, dynamic>? _activeStream;

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAccounts() async {
    setState(() => _loading = true);
    final res = _platform == 'youtube'
        ? await _streaming.listYoutubeAccounts()
        : await _streaming.listFacebookAccounts();
    if (!mounted) return;
    setState(() {
      _accounts = res;
      _selectedChannelId = res.isNotEmpty
          ? (res.first['id'] ?? res.first['channelId'])?.toString()
          : null;
      _loading = false;
    });
  }

  Future<void> _connect() async {
    final url = _platform == 'youtube'
        ? _streaming.youtubeOAuthUrl()
        : _streaming.facebookOAuthUrl();
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      BmsToast.info(
          context, 'Complete sign-in in your browser, then return to the app.');
    } else {
      BmsToast.error(context, 'Could not open browser');
    }
  }

  Future<void> _goLive() async {
    if (_platform != 'youtube') {
      BmsToast.info(context, 'Facebook streaming coming soon');
      return;
    }
    if (_accounts.isEmpty) {
      BmsToast.error(context, 'Connect a YouTube account first');
      return;
    }
    setState(() => _loading = true);
    final stream = await _streaming.createYoutubeStream(
      matchId: widget.matchId,
      title: _titleCtrl.text.trim().isEmpty
          ? 'Live Match'
          : _titleCtrl.text.trim(),
      channelId: _selectedChannelId,
    );
    if (!mounted) return;

    if (stream != null) {
      // Persist the stream URL on the match so the live overlay / viewers
      // can find it. Best-effort — the YT stream creation already wired
      // the relationship server-side.
      await _scoring.updateStreamConfig(
        matchId: widget.matchId,
        platform: 'youtube',
        streamUrl:
            stream['embedUrl']?.toString() ?? stream['streamUrl']?.toString(),
        streamKey: stream['streamKey']?.toString(),
      );
      setState(() {
        _activeStream = stream;
        _loading = false;
      });
      BmsToast.success(context, 'Stream live');
    } else {
      setState(() => _loading = false);
      BmsToast.error(context, 'Failed to start stream');
    }
  }

  Future<void> _endLive() async {
    setState(() => _loading = true);
    final ok = await _streaming.endYoutubeStream(widget.matchId);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (ok) _activeStream = null;
    });
    BmsToast.success(context, ok ? 'Stream ended' : 'Failed to end stream');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text('Go Live', style: TextStyle(color: Colors.white)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Platform picker
            Row(children: [
              _platformChip('youtube', Icons.ondemand_video, 'YouTube'),
              const SizedBox(width: 10),
              _platformChip('facebook', Icons.facebook, 'Facebook'),
            ]),
            const SizedBox(height: 24),

            if (_activeStream != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.errorRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.errorRed.withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(children: [
                      Icon(LucideIcons.video,
                          color: AppColors.errorRed, size: 18),
                      SizedBox(width: 8),
                      Text('LIVE',
                          style: TextStyle(
                              color: AppColors.errorRed,
                              fontWeight: FontWeight.w700)),
                    ]),
                    const SizedBox(height: 8),
                    SelectableText(
                      _activeStream!['embedUrl']?.toString() ??
                          _activeStream!['streamUrl']?.toString() ??
                          'Stream is live',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _loading
                          ? null
                          : () {
                              Clipboard.setData(ClipboardData(
                                  text:
                                      _activeStream!['streamKey']?.toString() ??
                                          ''));
                              BmsToast.info(context, 'Stream key copied');
                            },
                      icon: const Icon(LucideIcons.copy,
                          size: 14, color: Colors.white),
                      label: const Text('Copy stream key',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              PrimaryGradientButton(
                label: 'END STREAM',
                isLoading: _loading,
                onPressed: _loading ? null : _endLive,
                height: 56,
              ),
            ] else ...[
              // Connect / pick account
              if (_loading)
                const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
              else if (_accounts.isEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Connect your account to start streaming.',
                      style: TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _connect,
                      icon: const Icon(LucideIcons.externalLink,
                          size: 16, color: AppColors.primary),
                      label: Text(
                          'Connect ${_platform == 'youtube' ? 'YouTube' : 'Facebook'}',
                          style: const TextStyle(color: AppColors.primary)),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _loadAccounts,
                      child: const Text('I have connected — refresh',
                          style: TextStyle(color: Colors.white54)),
                    ),
                  ],
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Channel',
                        style: TextStyle(color: Colors.white70)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedChannelId,
                      dropdownColor: AppColors.surfaceL2,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        filled: true,
                        fillColor: AppColors.surfaceL1,
                        border: OutlineInputBorder(borderSide: BorderSide.none),
                      ),
                      items: _accounts.map((a) {
                        final id =
                            (a['id'] ?? a['channelId'])?.toString() ?? '';
                        final name = a['name']?.toString() ??
                            a['title']?.toString() ??
                            id;
                        return DropdownMenuItem(value: id, child: Text(name));
                      }).toList(),
                      onChanged: (v) => setState(() => _selectedChannelId = v),
                    ),
                  ],
                ),
              const SizedBox(height: 16),
              const Text('Stream title',
                  style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 8),
              TextField(
                controller: _titleCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceL1,
                  border: OutlineInputBorder(borderSide: BorderSide.none),
                  hintText: 'e.g. India vs Australia — Live',
                  hintStyle: TextStyle(color: Colors.white30),
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                ),
              ),
              const SizedBox(height: 20),
              PrimaryGradientButton(
                label: 'GO LIVE',
                isLoading: _loading,
                onPressed: _loading || _accounts.isEmpty ? null : _goLive,
                height: 56,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _platformChip(String value, IconData icon, String label) {
    final selected = _platform == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _platform = value;
            _accounts = const [];
            _selectedChannelId = null;
          });
          _loadAccounts();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : AppColors.surfaceL1,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: selected ? AppColors.primary : AppColors.borderSoft),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  color: selected ? Colors.black : Colors.white70, size: 18),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      color: selected ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}
