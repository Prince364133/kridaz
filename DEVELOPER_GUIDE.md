# Kridaz Developer Guide

Welcome to the Kridaz development team! This guide will help you understand the project structure and how to contribute effectively.

## 🏗 Scalable Folder Structure

### Backend (`/server`)
We use a **Domain-Driven Modular Architecture**. Each feature area is encapsulated in its own module.

- **`models/`**: Centralized Mongoose schemas.
- **`modules/`**: The heart of the application logic.
  - `[feature]/[feature].controller.js`: Business logic and request handling.
  - `[feature]/[feature].validator.js`: Zod schemas for input validation.
  - `[feature]/[feature].service.js`: (Optional) Reusable logic/DB queries.
- **`routes/`**: Route definitions that link URL paths to module controllers.
- **`middleware/`**: Shared functions like `verifyToken`, `validate`, and `errorHandler`.

**How to add a new backend feature:**
1. Create a new folder in `server/modules/[new-feature]`.
2. Define your logic in `controller.js`.
3. Define validation in `validator.js`.
4. Register the routes in `server/routes/`.

---

### Frontend (`/client/user`)
We use a **Layered Component Architecture**.

- **`components/`**: UI building blocks.
  - `common/`: Reusable, generic components (Buttons, Modals, Inputs).
  - `layout/`: Shell components (Navbar, Footer, Sidebar).
  - `[feature]/`: Feature-specific components (e.g., `reviews/`, `auth/`).
- **`pages/`**: View-level components that compose other components.
- **`services/`**: Centralized API communication using Axios.
- **`hooks/`**: Custom React hooks for shared stateful logic.
- **`redux/`**: Global state management.

**How to add a new page:**
1. Create a new component in `client/user/src/pages/`.
2. If it needs a new route, add it to `client/user/src/router.jsx`.
3. Use components from `components/` to build your UI.
4. Use `src/services/api.js` for any backend communication.

**Deep Dive Documentation:**
- [Frontend Architecture](docs/frontend/ARCHITECTURE.md)
- [State Management (RTK/RTK Query)](docs/frontend/STATE_MANAGEMENT.md)
- [Component Design Standards](docs/frontend/COMPONENT_DESIGN.md)
- [API Integration Standards](docs/frontend/API_INTEGRATION.md)

---

## 🛡 Validation & Error Handling

### Backend Validation
Always use **Zod** for request validation.
```javascript
// example.validator.js
import { z } from "zod";
export const exampleSchema = z.object({
  name: z.string().min(3),
});

// routes.js
router.post("/", validate(exampleSchema), controller.handler);
```

### Frontend Error Resilience
- Use the global `ErrorBoundary` for catching runtime crashes.
- All API calls through `services/api.js` automatically handle 401 (unauthorized) errors.

---

## 🛠 Tech Stack
- **Database**: MongoDB (Mongoose)
- **Backend**: Node.js, Express
- **Frontend**: React, Redux Toolkit, Tailwind CSS
- **Tools**: Axios (API), Zod (Validation), Lucide (Icons)

---

## 🚀 CI/CD Pipeline
We use GitHub Actions for automated testing and builds. The configuration is located in `.github/workflows/ci.yml`.

- **On Push/PR to Main**:
  - Runs server-side tests (Jest).
  - Builds the React frontend to catch build errors.
  - Performs security audits on dependencies.

## 🚦 Getting Started
1. Clone the repo.
2. Run `npm install` in the root (for dev tools) and in `server/` and `client/user/`.
3. Set up your `.env` in `server/`.
4. Run `npm run dev` in both `server/` and `client/user/`.

Happy coding! 🚀
