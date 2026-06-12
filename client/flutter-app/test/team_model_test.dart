import 'package:flutter_test/flutter_test.dart';
import 'package:kridaz/models/team_model.dart';

void main() {
  group('TeamModel.fromJson', () {
    test('parses full response', () {
      final json = {
        'id': 'abc123',
        'name': 'Thunder XI',
        'description': 'We play to win',
        'teamCode': 'THX1234567',
        'image': 'https://cdn.example.com/team.jpg',
        'logo': null,
        'sportType': 'Cricket',
        'city': 'Hyderabad',
        'captainName': 'Ravi',
        'captainPhone': '9876543210',
        'ownerId': 'user001',
        'qrCode': null,
        'members': [
          {
            'teamId': 'abc123',
            'userId': 'user001',
            'role': 'CAPTAIN',
            'status': 'JOINED',
            'user': {
              'firstName': 'Ravi',
              'profilePhoto': null,
              'city': 'Hyderabad'
            },
          }
        ],
        'customMembers': [],
      };

      final model = TeamModel.fromJson(json);

      expect(model.id, 'abc123');
      expect(model.name, 'Thunder XI');
      expect(model.teamCode, 'THX1234567');
      expect(model.sportType, 'Cricket');
      expect(model.members.length, 1);
      expect(model.members[0].role, TeamRole.captain);
      expect(model.members[0].status, TeamMemberStatus.joined);
      expect(model.members[0].userName, 'Ravi');
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'xyz',
        'name': 'Test Team',
        'teamCode': 'TEST000001',
        'sportType': 'Football',
        'ownerId': 'u1',
        'members': [],
        'customMembers': [],
      };
      final model = TeamModel.fromJson(json);
      expect(model.description, isNull);
      expect(model.city, isNull);
      expect(model.customMembers, isEmpty);
    });
  });

  group('TeamMemberModel.fromJson', () {
    test('maps all role strings', () {
      for (final pair in [
        ['CAPTAIN', TeamRole.captain],
        ['VICE_CAPTAIN', TeamRole.viceCaptain],
        ['PLAYER', TeamRole.player],
        ['GUEST', TeamRole.guest],
      ]) {
        final json = {
          'teamId': 't1',
          'userId': 'u1',
          'role': pair[0],
          'status': 'JOINED',
          'user': {'firstName': 'Ali', 'profilePhoto': null, 'city': null},
        };
        expect(TeamMemberModel.fromJson(json).role, pair[1]);
      }
    });
  });
}
