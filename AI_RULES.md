# AI Rules for HostConnect Application

This document outlines the technical stack and specific library usage guidelines for developing the HostConnect application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

*   **Frontend Framework:** React.js
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **UI Component Library:** shadcn/ui (built on Radix UI)
*   **Routing:** React Router DOM
*   **Data Fetching & State Management:** TanStack React Query
*   **Icons:** Lucide React
*   **Form Management:** React Hook Form with Zod for validation
*   **Date Handling:** date-fns
*   **Backend/Database/Authentication:** Supabase

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these specific guidelines for library usage:

*   **UI Components:**
    *   **Always** use components from `shadcn/ui` (located in `src/components/ui/`) for all user interface elements.
    *   **Do not** modify the `shadcn/ui` component files directly. If a `shadcn/ui` component needs customization beyond its props, create a new wrapper component in `src/components/` that utilizes and extends the `shadcn/ui` component.
*   **Styling:**
    *   **Exclusively** use Tailwind CSS classes for all styling. Avoid writing custom CSS in separate files or using inline styles, except for global styles defined in `src/index.css`.
    *   Ensure designs are responsive by utilizing Tailwind's responsive utility classes.
*   **Routing:**
    *   **Always** use `react-router-dom` for all client-side navigation.
    *   Define all main application routes within `src/App.tsx`.
*   **Data Fetching:**
    *   **Always** use `TanStack React Query` for managing server state, data fetching, caching, and synchronization.
    *   Custom hooks for data fetching should be placed in `src/hooks/`.
*   **Forms:**
    *   **Always** use `react-hook-form` for form state management and validation.
    *   **Always** use `zod` for schema-based form validation.
*   **Icons:**
    *   **Always** use icons from the `lucide-react` library.
*   **Date Manipulation:**
    *   **Always** use `date-fns` for any date formatting, parsing, or manipulation tasks.
*   **Toasts/Notifications:**
    *   **Always** use the `useToast` hook from `src/hooks/use-toast.ts` for displaying transient notifications to the user. This hook is built upon `@radix-ui/react-toast`.
    *   The `Sonner` component is also available for more persistent or distinct types of notifications, but `useToast` should be the default for general feedback.
*   **Backend/Authentication:**
    *   **Always** interact with the backend and handle authentication using the `supabase` client from `src/integrations/supabase/client.ts`.
*   **Utility Functions:**
    *   Place general utility functions (e.g., `cn` for Tailwind class merging) in `src/lib/utils.ts`.
*   **File Structure:**
    *   New pages should be created in `src/pages/`.
    *   New reusable components should be created in `src/components/`.
    *   New custom hooks should be created in `src/hooks/`.
    *   Static assets should be placed in `src/assets/`.