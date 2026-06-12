# BMS App - Development Progress

## Project Overview
**BM Sportz** - A Flutter mobile app for sports booking, game hosting, and community features with FastAPI backend and PostgreSQL database.

---

## Completed Tasks

### 1. iOS Deployment Target Updated
Updated `ios/Podfile` deployment target to iOS 15.0 to satisfy Firebase Auth + plugin requirements.

### 2. iOS Firebase Configuration Fixed
Fixed iOS crash on login by adding a real `GoogleService-Info.plist`, updating `Info.plist` URL scheme (reversed client ID), and correcting iOS values in `firebase_options.dart`.

### 3. Google Sign-In iOS Client ID Fix
Updated `google_auth_service.dart` to explicitly pass the iOS `clientId` to `GoogleSignIn` to prevent Google Sign-In crashes on iOS.

### 4. Zone Mismatch Error Fixed
Resolved Flutter “Zone mismatch” by ensuring `WidgetsFlutterBinding.ensureInitialized()` and `runApp()` execute in the same zone (removed `runZonedGuarded`).

### 5. PostgreSQL Database Setup
Created PostgreSQL user `saavik` (`saavikdev`) and database `bms_saavik`. Updated backend config in `backend/app/core/config.py` to use the new connection string.

### 6. Backend Server Running
FastAPI backend runs on port 8000 with `/health` and Swagger at `/docs`, verifying API + DB connectivity.

### 7. User Model Extended
Extended backend `User` with `first_name`, `last_name`, `date_of_birth`, `onboarding_complete` and updated Pydantic schemas to match.

### 8. User Sync API Added
Added user upsert endpoint `POST /api/v1/users/sync/{user_id}` plus lookup endpoints for email/phone to support login sync.

### 9. Frontend UserService Backend Sync
Enhanced `UserService` with backend sync/fetch methods and onboarding checks. Added platform-aware base URL for iOS/Android.

### 10. Onboarding Data Sync
Updated onboarding flow (`OnboardingData`) to save name/DOB/gender/sports and sync to PostgreSQL after onboarding completion.

### 11. Auth Wrapper Login Sync
Updated `AuthStateWrapper` to sync user on login and route users based on onboarding completion.

### 12. iOS Simulator API URL Fix
Fixed backend connectivity timeouts on iOS by switching API base URL from `localhost` to `127.0.0.1` in `UserService` and `GameService`.

### 13. Logout Button Added
Added logout button to profile (`user_profile_detail_screen.dart`) with confirmation dialog, sign-out, and navigation back to the welcome screen.

### 14. Host Game Backend + DB Support
Updated `Game` model/schema to allow saving games with a location string (optional `venue_id`) and added fields like `game_mode` and `is_free`.

### 15. Host Game Frontend Integration
Created `GameService` and updated `HostGameScreen` to create games via backend API, store them in PostgreSQL, and track creator via `host_id`.

### 16. Location Picker & UI Stability Fixes
Improved `SelectLocationScreen` permissions/error handling and fixed yellow underlines/navigation glitches by wrapping `NewHomeDashboard` content in a `Material` widget and correcting the build method.

### 17. Cleaned Up - PostgreSQL Only Architecture
Removed legacy mongo database service. App now uses only Firebase (auth) + PostgreSQL (data via FastAPI). Updated `UserService` to use PostgreSQL directly, cleaned up `main.dart` and `api_config.dart`.

### 18. Profile Screen - Database Integration
Updated `UserProfileDetailScreen` to fetch and display user data from PostgreSQL database. Removed hardcoded values, added dynamic loading of name, DOB, email, phone, interests, and profile photo.

### 19. Profile Screen - Removed Stats & Connected Accounts
Removed the "Connected Accounts" and "Stats" sections from the profile screen as requested. Cleaned up unused widget methods.

### 20. Profile Picture & Phone Number Update
Added ability to update profile picture (image picker) and phone number from profile screen. Changes sync to PostgreSQL database via `UserService.updatePhoneNumber()` and `UserService.updatePhotoUrl()`.

### 21. Reusable Back Button Widget
Created `AppBackButton` widget (`lib/widgets/common/back_button.dart`) for consistent navigation across screens. Added to `NearbyPlayersSearchScreen`, `NewSearchScreen`, `HostGameScreen`, and `SelectLocationScreen`.

### 22. Google Maps API Key Fix
Fixed Google Maps not rendering by correcting API key typo in `ios/Runner/Info.plist` (changed `YAIzaSy...` to `AIzaSy...`).

### 23. Location Feature - GPS Integration
Added location field to user profile with GPS-based location fetching:
- Added `location`, `latitude`, `longitude` columns to PostgreSQL `users` table
- Updated backend `User` model and Pydantic schemas
- Added `UserService.updateLocation()` method
- Profile screen now has Location field that fetches current GPS coordinates and reverse geocodes to city name
- Location saves to database and displays on homepage

### 24. Homepage Profile Picture & Location Display
Updated `AppHeader` widget to:
- Display user's profile picture (from database) instead of generic icon
- Show user's saved location below greeting (fetched from database)
- Added `userPhotoUrlProvider` to `user_provider.dart`

### 25. Fixed Data Persistence Issues
Fixed issues where profile picture and location were not persisting:
- Updated `fetchUserFromBackend()` to include `location`, `latitude`, `longitude` fields in returned data
- Changed `userProfileProvider` to use `autoDispose` for proper refresh behavior
- Data now correctly flows from PostgreSQL → UserService → Riverpod providers → UI
- Profile picture (Google account photo) and location now persist across navigation

### 26. Profile Picture Upload - Mock AWS S3 Storage
Implemented image upload system with mock AWS S3 bucket that can be easily replaced with real S3:

**Backend:**
- Created `backend/mockawsbuckets/profile_pictures/` folder for local image storage
- Added `backend/app/api/v1/upload.py` with endpoints:
  - `POST /api/v1/upload/profile-picture/{user_id}` - Upload image
  - `GET /api/v1/upload/profile-picture/{filename}` - Retrieve image
  - `DELETE /api/v1/upload/profile-picture/{filename}` - Delete image

**Frontend:**
- Created `lib/services/image_storage_service.dart` with:
  - `ImageStorageService` abstract class (interface)
  - `MockAwsS3Service` implementation for local backend storage
  - `ImageStorageFactory` to easily swap implementations
  - Placeholder `RealAwsS3Service` class for production

**Profile Screen:**
- Updated `_pickImage()` to upload selected image to storage
- Shows upload progress with spinner
- Saves uploaded image URL to database
- Image persists across navigation and app restarts

**To switch to real AWS S3:**
1. Implement `RealAwsS3Service` using `aws_s3_client` package
2. Change `ImageStorageFactory.getService()` to return `RealAwsS3Service`
3. Configure AWS credentials and bucket name

### 27. Fixed Image URL Double Path Bug
Fixed bug where image URLs were being constructed with double `/api/v1/api/v1/`:
- Added `_serverBaseUrl` (without `/api/v1`) to `MockAwsS3Service`
- Fixed URL construction in `uploadProfilePicture()` to use `_serverBaseUrl` + response URL
- Images now load correctly from `http://127.0.0.1:8000/api/v1/upload/profile-picture/...`

### 28. Nearby Players - Complete Social Feature

Implemented a comprehensive social feature for finding and connecting with nearby players.

**Backend - New Database Tables:**
- `friendships` - Stores friend relationships (pending/accepted/rejected/blocked)
- `messages` - Chat messages with support for text, images, and files
- `conversations` - Tracks conversation threads and unread counts
- `notifications` - Friend requests, message notifications, etc.

**Backend - New API Endpoints:**
- `POST /api/v1/friends/request` - Send friend request
- `POST /api/v1/friends/accept/{id}` - Accept friend request
- `POST /api/v1/friends/reject/{id}` - Reject friend request
- `DELETE /api/v1/friends/remove/{id}` - Remove friend
- `GET /api/v1/friends/list` - Get friends list
- `GET /api/v1/friends/requests/pending` - Get pending requests
- `POST /api/v1/friends/nearby` - Search nearby players with filters
- `POST /api/v1/messages/send` - Send message
- `GET /api/v1/messages/conversation/{id}` - Get conversation messages
- `GET /api/v1/messages/conversations` - Get all conversations
- `WS /api/v1/chat/ws/{user_id}` - WebSocket for real-time chat
- `GET /api/v1/notifications/` - Get notifications
- `POST /api/v1/notifications/read/{id}` - Mark notification read

**Frontend - New Screens:**
- `nearby_players_home_screen.dart` - Map with draggable pin, search bar, distance slider
- `add_friends_screen.dart` - Find nearby players with filters (age, gender, sport)
- `my_friends_screen.dart` - Two tabs: Friends list & Pending requests
- `chat_screen.dart` - Real-time chat with WebSocket
- `conversations_screen.dart` - Recent chats list

**Frontend - New Services:**
- `friends_service.dart` - API calls for friend operations
- `messages_service.dart` - API calls for messaging
- `notifications_service.dart` - API calls for notifications
- `chat_websocket_service.dart` - WebSocket connection for real-time chat

**Features:**
- Search for locations using Google Places autocomplete
- Draggable green pin on map to set search location
- Distance slider (1-69+ km) for search radius
- Filter players by age, gender, and sports
- Send/accept/reject friend requests
- Real-time chat with WebSocket (text + images)
- Notification system for friend requests
- Location sharing toggle (on/off)
- Unread message badges

**User Model Updates:**
- `location_sharing_enabled` - Boolean to control visibility in searches
- `search_radius_km` - Default search radius preference

---

## Database Schema Updates
- `users` table now includes: `location`, `latitude`, `longitude`, `location_sharing_enabled`, `search_radius_km` columns
- New tables: `friendships`, `messages`, `conversations`, `notifications`

---

*Last Updated: January 15, 2026*