import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/story_model.dart';
import '../services/story_service.dart';
import '../services/auth_manager.dart';

class StoryGroupsNotifier extends AsyncNotifier<List<StoryGroup>> {
  @override
  Future<List<StoryGroup>> build() => _fetch();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<List<StoryGroup>> _fetch() async {
    final me = AuthManager().currentUser;
    final myId = (me?['id'] ?? me?['_id'])?.toString() ?? '';

    // Fetch the general feed and the user's own stories in parallel
    final results = await Future.wait([
      StoryService().getStories(),
      StoryService().getMyStories(),
    ]);

    final feed = results[0] as List<StoryGroup>;
    final myGroup = results[1] as StoryGroup?;

    if (myGroup == null || myId.isEmpty) return feed;

    // If the feed already includes the current user's group, keep that one
    // (it has server-populated viewer data). Otherwise prepend our own.
    final alreadyIncluded = feed.any((g) => g.author.id == myId);
    if (alreadyIncluded) return feed;

    return [myGroup, ...feed];
  }
}

final storyGroupsProvider =
    AsyncNotifierProvider<StoryGroupsNotifier, List<StoryGroup>>(
  StoryGroupsNotifier.new,
);
