# TurfSpot Frontend 🎨

The TurfSpot frontend is a unified React application built with Vite, utilizing a modular and component-driven approach.

## 🏗 Directory Structure

### `src/components/`
Organized by scope and feature:
- **`common/`**: Reusable UI elements (Buttons, Modals, Spinners).
- **`layout/`**: Structural components like the `Navbar`, `Footer`, and `PartnerSidebar`.
- **`[feature]/`**: Components specific to a feature (e.g., `reviews/`, `turf/`, `Marketing/`).

### `src/pages/`
High-level view components. These are linked to URLs in `router.jsx`.
- Includes specialized dashboards for Owners, Coaches, and Umpires.

### `src/redux/`
Global state management using Redux Toolkit.
- Slices for `user`, `auth`, and `booking` state.

### `src/services/`
Centralized API management.
- `api.js`: Main Axios instance with global error handling and interceptors.

## 🚦 Navigation & RBAC
We use a centralized `router.jsx` with a `ProtectedRoute` component.
- **RBAC**: Routes are protected based on the user's role (e.g., `admin`, `owner`, `user`).
- **Unified Navbar**: The Navbar dynamically shows options based on the authenticated user's role.

## 💅 Styling
- **Tailwind CSS**: Core styling framework.
- **DaisyUI**: Component library for base UI elements.
- **Icons**: Lucide-react.

## 🚀 Adding a New Page
1. Create a component in `src/pages/`.
2. Add a new route entry in `src/router.jsx`.
3. If it's a partner feature, ensure it uses `ProtectedRoute` with the appropriate `allowedRoles`.
