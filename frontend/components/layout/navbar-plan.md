
# Responsive Navbar: Product & Implementation Plan

---

## 1. Product Manager Hat: The "What" and "Why"

### Core Objective
To provide users with a consistent, intuitive, and responsive navigation bar that serves as the primary wayfinding tool for the `player-web` application. The navbar must adapt its content based on the user's authentication state and screen size, ensuring a seamless experience across all devices.

### Key Features & User Stories

*   **As a new or unauthenticated user, I want to easily find links to explore venues and understand the platform, with clear calls-to-action to sign up or log in.**
*   **As an authenticated player, I want quick access to my dashboard, bookings, and profile settings, making it easy to manage my activities.**
*   **As a user on a mobile device, I want the navigation to be collapsed into a "hamburger" menu to save screen space, while still being easily accessible.**
*   **As a user on a desktop device, I want to see the main navigation links spread out horizontally for quick scanning and access.**

### Navigation Links Strategy

| Link              | Unauthenticated User | Authenticated User | Justification                               |
| ----------------- | -------------------- | ------------------ | ------------------------------------------- |
| **Logo (Home)**   | ✅                   | ✅                 | Standard practice; links to the landing page. |
| **Explore**       | ✅                   | ✅                 | Core discovery feature for all users.       |
| **Leaderboards**  | ✅                   | ✅                 | Key community feature; drives engagement.   |
| **Offers**        | ✅                   | ✅                 | Drives conversions and user value.          |
| **Dashboard**     | ❌                   | ✅                 | Personalized hub for logged-in players.     |
| **My Bookings**   | ❌                   | ✅                 | Essential management page for players.      |
| **Login**         | ✅                   | ❌                 | Primary CTA for returning users.            |
| **Sign Up**       | ✅                   | ❌                 | Primary CTA for new users.                  |
| **User Profile**  | ❌                   | ✅                 | Access to settings, profile, and logout.    |

---

## 2. UI/UX Designer Hat: The "How" and "Look & Feel"

### Aesthetic & Principles
*   **Clean & Modern:** The navbar will be clean, uncluttered, and aligned with the `@workspace/ui` design system.
*   **Brand-Forward:** The company logo will be the most prominent element on the left.
*   **Responsive First:** The design will gracefully transition from a horizontal desktop layout to a collapsed mobile layout.

### Desktop Layout (`> 768px`)
*   **Structure:** A full-width, single-row horizontal bar.
*   **Left Side:** Logo.
*   **Center:** Primary navigation links (`Explore`, `Leaderboards`, `Offers`). For authenticated users, `Dashboard` and `My Bookings` are also included.
*   **Right Side:**
    *   **Unauthenticated:** "Login" and "Sign Up" buttons. "Login" will be a secondary/ghost button, and "Sign Up" will be the primary button to draw attention.
    *   **Authenticated:** A `UserMenu` dropdown, triggered by clicking on the user's avatar or name. This dropdown will contain links to `Profile`, `My Performance`, and `Logout`.

### Mobile Layout (`< 768px`)
*   **Structure:** A compact bar containing the logo and a hamburger menu icon.
*   **Left Side:** Logo.
*   **Right Side:** A "hamburger" menu icon (`Menu` from `lucide-react`).
*   **Behavior:** Tapping the hamburger icon will open a full-height, slide-in `Sheet` component from the right side of the screen. This sheet will contain:
    1.  All relevant navigation links, stacked vertically.
    2.  The "Login" and "Sign Up" buttons (for unauthenticated users).
    3.  A user profile section at the top with name and links to `Profile` and `Logout` (for authenticated users).

---

## 3. Senior Developer Hat: Implementation Strategy

### File Structure & Components
*   **Main Component:** `apps/player-web/components/layout/Navbar.tsx`
*   **Profile Dropdown:** `apps/player-web/components/layout/UserNav.tsx` (for the desktop user menu).
*   **Mobile Menu:** `apps/player-web/components/layout/MobileNav.tsx` (containing the `Sheet` and its contents).

### Technology & Libraries
*   **Framework:** Next.js 14 (App Router).
*   **UI Components:** `@workspace/ui` for `Button`, `Sheet`, `DropdownMenu`, `Avatar`.
*   **Icons:** `lucide-react` for menu, user, and other icons.
*   **Styling:** Tailwind CSS for all styling and responsive utilities (`md:`, `hidden`, etc.).
*   **State Management:**
    *   A custom `useAuth()` hook will be created to read authentication status and user data from the Redux store (`authSlice`).
    *   `useState` within `MobileNav.tsx` will manage the open/closed state of the `Sheet`.

### Implementation Plan

1.  **Create `useAuth` Hook (1 hour):**
    *   Develop a simple hook `apps/player-web/hooks/useAuth.ts` that selects `isAuthenticated` and `user` from the Redux store. This decouples the Navbar from the store's implementation details.

2.  **Develop `UserNav.tsx` (2 hours):**
    *   Build the desktop-only user profile dropdown.
    *   Use `@workspace/ui`'s `DropdownMenu` component.
    *   It will display the user's avatar and name.
    *   Dropdown items will include links to `/profile`, `/my-performance`, and a "Logout" button that dispatches the logout action.

3.  **Develop `MobileNav.tsx` (3 hours):**
    *   This component will render the hamburger button.
    *   It will use `@workspace/ui`'s `Sheet` component.
    *   The `SheetContent` will contain two sections:
        *   **Unauthenticated:** A simple list of public links and Login/Sign Up buttons.
        *   **Authenticated:** An avatar and name at the top, followed by a vertical list of all authenticated user links.

4.  **Develop `Navbar.tsx` (3 hours):**
    *   This is the main orchestrator component.
    *   It will use the `useAuth` hook to get the current auth state.
    *   It will contain two main divs for responsiveness:
        *   One for the desktop view (`<div className="hidden md:flex">...</div>`), which will render the links horizontally and include the `<UserNav />` component or Login/Sign Up buttons.
        *   One for the mobile view (`<div className="md:hidden">...</div>`), which will render the `<MobileNav />`.
    *   Use `next/link` for all internal navigation to ensure client-side routing.

5.  **Integration & Testing (2 hours):**
    *   Add the `<Navbar />` to the main `apps/player-web/app/layout.tsx`.
    *   Thoroughly test both authenticated and unauthenticated states.
    *   Test responsiveness by resizing the browser window, ensuring the switch between mobile and desktop is seamless.
    *   Verify all links and actions (login, logout, navigation) work as expected.
