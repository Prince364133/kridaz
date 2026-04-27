HeroBanner Enhancement Plan

**Goal:** Transform the `HeroBanner` component (`apps/player-web/app/main/HeroBanner.tsx`) into a modern, accessible, and maintainable component aligning with the established standards for Senior Engineer, Senior Product Manager, and UI/UX Designer.

**Key Areas for Enhancement:**

1.  **Color Management (Senior Engineer, UI/UX Designer):**
    *   Replace all hardcoded green hex values (`#6aff00`, `#71B300`) with the `--color-turf-green` CSS variable (exposed as `text-turf-green`, `bg-turf-green` etc.).
    *   Ensure hover states and other color interactions are consistent with the new brand color.

2.  **Component Reusability & Consistency (Senior Engineer, UI/UX Designer):**
    *   Replace native `<input>` elements with `@workspace/ui/components/input`.
    *   Replace native `<button>` elements with `@workspace/ui/components/button`.
    *   Ensure these components receive appropriate `className` props to maintain existing styling and adapt to the overall theme.

3.  **Search Functionality (Senior Engineer, Senior Product Manager):**
    *   Implement a basic `useState` and `onSubmit` handler for the search form.
    *   Ensure accessibility for the search inputs.
    *   The `SearchIcon`, `SendIcon`, `LocationIcon` are currently custom components. They will be retained for now, assuming their implementation handles SVG accessibility.

4.  **Accessibility (UI/UX Designer, Senior Engineer):**
    *   Add `aria-label` or `sr-only` text to input fields and icon buttons within the search bar for screen reader users.
    *   Ensure proper focus management and keyboard navigation.

5.  **Branding & Content (Senior Product Manager, UI/UX Designer):**
    *   Review existing text and ensure it aligns with the "Owl Turf" branding. (The current slogan "FUEL YOUR PASSION FOR SPORTS" can remain as it fits the theme).
    *   Ensure clear Calls to Action (CTAs) for "Book a Ground" and "Join a Match."

**Detailed Steps:**

**Step 1: Replace Hardcoded Colors with `turf-green`**
   - Identify all instances of `#6aff00` and `#71B300` and replace with `turf-green`.

**Step 2: Refactor Native Inputs to `@workspace/ui/components/input`**
   - Import `Input` from `@workspace/ui/components/input`.
   - Replace `<input>` tags, transferring props and ensuring styles are correctly applied.

**Step 3: Refactor Native Buttons to `@workspace/ui/components/button`**
   - Import `Button` from `@workspace/ui/components/button`.
   - Replace `<button>` tags, transferring props and ensuring styles are correctly applied.

**Step 4: Implement Basic Search Form Functionality**
   - Use `useState` for search and location input values.
   - Add an `onSubmit` handler to the `<form>` tag.

**Step 5: Enhance Accessibility**
   - Add `aria-label` attributes to input fields.
   - Ensure custom icons are accessible (e.g., `sr-only` span or `aria-label` on wrapper).

**Step 6: Review and Test**
   - Ensure all changes are visually correct and functional.
   - Run `tsc --noEmit` to verify type safety.

This plan will be executed in a single `replace` call to make the change atomic.
