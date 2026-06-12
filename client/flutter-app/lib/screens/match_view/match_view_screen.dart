import 'package:flutter/material.dart';
import 'tabs/match_live_tab.dart';
import 'tabs/match_scorecard_tab.dart';
import 'tabs/match_squads_tab.dart';
import 'tabs/match_overs_tab.dart';
import 'tabs/match_analytics_tab.dart';

/// Tabbed viewer for a single match (LIVE / SCORECARD / SQUADS / OVERS /
/// ANALYTICS). Driven entirely by `matchId` — each tab fetches its own
/// data on first activation and re-syncs on socket reconnect.
class MatchViewScreen extends StatefulWidget {
  const MatchViewScreen({super.key, required this.matchId});
  final String matchId;

  @override
  State<MatchViewScreen> createState() => _MatchViewScreenState();
}

class _MatchViewScreenState extends State<MatchViewScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text('Match',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          indicatorColor: const Color(0xFF7CFE6A),
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle: const TextStyle(
              fontFamily: 'Poppins', fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'LIVE'),
            Tab(text: 'SCORECARD'),
            Tab(text: 'SQUADS'),
            Tab(text: 'OVERS'),
            Tab(text: 'ANALYTICS'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          MatchLiveTab(matchId: widget.matchId),
          MatchScorecardTab(matchId: widget.matchId),
          MatchSquadsTab(matchId: widget.matchId),
          MatchOversTab(matchId: widget.matchId),
          MatchAnalyticsTab(matchId: widget.matchId),
        ],
      ),
    );
  }
}
