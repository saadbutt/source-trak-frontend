# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server (runs on port 3000)
- `npm run build` - Build production bundle
- `npm test` - Run Jest tests
- `npm run eject` - Eject from create-react-app (irreversible)

## Architecture Overview

This is a React frontend application for SourceTrak, a blockchain-powered supply chain transparency platform. The app is built using Create React App with React Router for navigation.

### Key Architecture Components

**Authentication Flow (Milestone 1 — JWT + refresh-token rotation):**
- Bearer JWT access token (short TTL) + opaque refresh token (long TTL, rotates on every refresh).
- Tokens persisted to localStorage (`sourcetrak_access_token`, `sourcetrak_refresh_token`); user profile cached at `sourcetrak_user`. **Known accepted risk: refresh token is XSS-exposed.** Acceptable for MVP because alternative (in-memory only) would force re-login on every reload. Revisit when a BFF / serverless proxy is feasible.
- `AuthContext` exposes: `login`, `signup`, `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`, `changePassword`, `logout`, `logoutAll`, plus `user`, `loading`, `isAuthenticated`, `isFarmer`.
- `api.js` attaches `Authorization: Bearer <access_token>` automatically and runs a single-flight refresh interceptor on 401: queue concurrent failures onto one `/auth/refresh` call, retry on success, force logout on rotation revoke (server-side detection of replay).
- Routes: `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`. Protected routes still gated by `ProtectedRoute`.
- **Anti-enumeration is a UX requirement.** Login 401, signup, forgot-password, resend-verification, and verify-email errors are all written to leak no information about whether an email exists, is verified, or is locked. Don't "improve" the copy by branching on status codes.

**API Integration:**
- Centralized API service (`src/services/api.js`) handles all backend communication.
- Dev + prod both proxy to `https://staging.sourcetrak.com` (the new auth backend is deployed there). Vercel rewrites in `vercel.json` route deployed builds.
- Backend base path: `/api`. Auth surface lives under `/api/auth/*`.

**Component Structure:**
- Main routes: Landing, Login/Signup, Dashboard, DataDetailView
- Components organized by feature with corresponding CSS files in `src/styles/`
- QR code generation functionality for batch tracking
- Role-based access control (Farmer role has special permissions)

**Data Flow:**
- Farm entry forms create batches via API
- Batch data includes blockchain integration for traceability
- Data history and detail views for supply chain tracking
- Local data storage utility for offline functionality

### Important Configuration

- **Deployment:** Configured for Vercel with API proxying.
- **Backend URL:** `https://staging.sourcetrak.com/api` (the new auth backend is deployed here; both dev `proxy` and Vercel rewrites point at it).
- **Styling:** Individual CSS files per component in `src/styles/`.
- **State Management:** React Context for auth, local state for components.

### Known M1 Follow-Ups (not yet done)

- The data-submission forms (`FarmEntryForm`, `ProcessingEntryForm`, `LogisticsEntryForm`, `DistributionEntryForm`, `ConsumerEntryForm`) still send legacy role strings (e.g. `"Farm/Producer"`, `"Processing/Packaging"`) and old payload shapes that won't validate against the new backend. M2 work.
- `Dashboard.getUserTraceabilityHistory` was repointed at `/me/history` so the screen still loads, but `Dashboard` itself hasn't been audited end-to-end against the new contract.
- `apiService.getAllUsers` is preserved but the new backend exposes every user's email to any authenticated caller. Either remove the call site or wait for backend to gate it.

### Testing

Uses React Testing Library and Jest (standard create-react-app testing setup).