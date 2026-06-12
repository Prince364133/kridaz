import '../services/user_service.dart';

class OnboardingData {
  static final OnboardingData _instance = OnboardingData._internal();
  factory OnboardingData() => _instance;
  OnboardingData._internal();

  String firstName = '';
  String lastName = '';
  String dateOfBirth = '';
  String? gender;
  List<String> interests = [];
  String? email;
  String? photoURL;
  String location = '';

  void clear() {
    firstName = '';
    lastName = '';
    dateOfBirth = '';
    gender = null;
    interests = [];
    email = null;
    photoURL = null;
    location = '';
  }

  bool get isComplete {
    return firstName.isNotEmpty &&
        lastName.isNotEmpty &&
        dateOfBirth.isNotEmpty &&
        gender != null &&
        interests.isNotEmpty;
  }

  Future<bool> saveToFirebase() async {
    if (!isComplete) return false;

    final userService = UserService();

    try {
      final localSuccess = await userService.saveUserProfile(
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        gender: gender!,
        interests: interests,
      );

      final backendSuccess = await userService.syncUserToBackend(
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        gender: gender!,
        interests: interests,
        photoUrl: photoURL,
        location: location.isNotEmpty ? location : null,
      );

      return backendSuccess || localSuccess;
    } catch (e) {
      return false;
    }
  }
}
