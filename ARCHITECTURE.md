# Kridaz Architecture

## Overview
Kridaz is a unified platform for turf booking and partner management (Venue Owners, Coaches, Umpires).

## Directory Structure

### Backend (`/server`)
- **`modules/`**: Domain-driven modules containing controllers, validators, and services.
  - `auth/`: Authentication and registration.
  - `turf/`: Turf management and search.
  - `booking/`: Reservation and payment logic.
  - `owner/`: Partner-specific dashboard and metrics.
  - `review/`: Ratings and feedback.
  - `blog/`: Article management.
  - `player/`: Public profile management.
  - `admin/`: System-level administration.
- **`models/`**: Mongoose models for data persistence.
- **`middleware/`**: Shared middleware (JWT, validation, error handling).
- **`routes/`**: Route definitions that consume module controllers.

### Frontend (`/client/user`)
- **`src/components/`**: Atomic components and layout elements.
- **`src/pages/`**: Unified page components for all users and partners.
- **`src/services/`**: Centralized API communication layer.
- **`src/hooks/`**: Custom React hooks for shared logic.
- **`src/store/`**: Redux state management.

## Key Design Patterns
1. **Unified Domain**: Single frontend domain for all user personas, controlled by RBAC.
2. **Schema-First Validation**: Every API request is validated against **Zod** schemas before processing.
3. **Centralized Error Handling**: Global error boundary on frontend and unified middleware on backend.
4. **Partner Dropdown**: Dynamic navigation pattern for secondary portals.

## 📈 Scalability Features

### Vertical Scalability (Features)
- **Module Isolation**: Adding a new feature (e.g., "Tournaments") only requires creating a new folder in `server/modules/` and registering a route. It doesn't affect existing code.
- **Zod Validation**: Centralized schemas ensure that as the API grows, validation logic remains consistent and easy to update.

### Horizontal Scalability (Architecture)
- **Stateless API**: The backend is stateless, relying on JWT for authentication, making it ready for horizontal scaling behind a load balancer.
- **Unified Frontend**: By merging portals into one domain, we reduce deployment overhead and share state/components efficiently across all user roles.

### Team Scalability (Developer Experience)
- **Standardized Documentation**: With `DEVELOPER_GUIDE.md` and module-specific READMEs, new developers can onboard and start working on specific features with minimal friction.
- **Consistent Layering**: The separation of Controllers, Validators, and Services ensures that multiple developers can work on different layers without merge conflicts.

## Technologies
- **Backend**: Node.js, Express, MongoDB (Mongoose), Zod.
- **Frontend**: React, Vite, Redux Toolkit, Tailwind CSS, Axios.
- **Testing**: Jest, Supertest.
