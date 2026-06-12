import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/navigation_provider.dart';

enum HomeAction {
  nearbyPlayers,
  hostGame,
  bookings,
  shop,
  myGames,
  bookGround,
  joinGame,
  myTeams,
  tournaments,
}

final homeActionProvider = Provider<HomeActionController>((ref) {
  return HomeActionController(ref);
});

class HomeActionController {
  final Ref ref;
  HomeActionController(this.ref);

  void handleAction(BuildContext context, HomeAction action) {
    switch (action) {
      case HomeAction.nearbyPlayers:
        _goToNearbyPlayers(context);
        break;
      case HomeAction.hostGame:
        _goToHostGame(context);
        break;
      case HomeAction.bookings:
        _goToBookings(context);
        break;
      case HomeAction.shop:
        _goToShop(context);
        break;
      case HomeAction.myGames:
        _goToMyGames(context);
        break;
      case HomeAction.bookGround:
        _goToArena(context);
        break;
      case HomeAction.joinGame:
        _goToJoinGame(context);
        break;
      case HomeAction.myTeams:
        _goToMyTeams(context);
        break;
      case HomeAction.tournaments:
        _goToTournaments(context);
        break;
    }
  }

  void _goToNearbyPlayers(BuildContext context) {
    ref.read(navigationProvider.notifier).setIndex(3);
  }

  void _goToHostGame(BuildContext context) {
    GoRouter.of(context).push('/host-game');
  }

  void _goToBookings(BuildContext context) {
    GoRouter.of(context).push('/bookings');
  }

  void _goToShop(BuildContext context) {
    ref.read(navigationProvider.notifier).setIndex(2);
  }

  void _goToMyGames(BuildContext context) {
    GoRouter.of(context).push('/my-games');
  }

  void _goToArena(BuildContext context) {
    ref.read(navigationProvider.notifier).setIndex(1);
  }

  void _goToJoinGame(BuildContext context) {
    GoRouter.of(context).push('/join-games');
  }

  void _goToMyTeams(BuildContext context) {
    GoRouter.of(context).push('/my-teams');
  }

  void _goToTournaments(BuildContext context) {
    GoRouter.of(context).push('/tournaments');
  }
}
