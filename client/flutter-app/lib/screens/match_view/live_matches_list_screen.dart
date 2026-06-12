import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/scoring_service.dart';
import '../../widgets/scoring/live_match_card.dart';

/// Discovery list — "what's live right now?". Polls `/scoring/live` every
/// 10s; ETag interceptor makes ~95% of those polls free (304s).
class LiveMatchesListScreen extends StatefulWidget {
  const LiveMatchesListScreen({super.key});

  @override
  State<LiveMatchesListScreen> createState() => _LiveMatchesListScreenState();
}

class _LiveMatchesListScreenState extends State<LiveMatchesListScreen> {
  final _scoring = ScoringService();
  List<Map<String, dynamic>> _items = const [];
  bool _loading = true;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 10), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final res = await _scoring.getLiveMatches();
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _items = res.data ?? const [];
        _error = null;
      } else {
        _error = res.error;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Live Matches',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: Colors.white,
        child: _loading && _items.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _items.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 120),
                      Center(
                        child: Text(
                          _error ?? 'No live matches right now.',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontFamily: 'Poppins'),
                        ),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) => LiveMatchCard(item: _items[i]),
                  ),
      ),
    );
  }
}
