# Story 7.12: Connection Profile Management (Browser)

**Story ID:** 7.12
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a user,
I want to save my server connection details (URL, API Key) in the browser,
So that I don't have to re-type them every time I open the app.

## Acceptance Criteria

### AC 1: Connection Form
- [x] Connection form in `AgentConnectionPanel.tsx`.
- [x] Connect initiates auth flow.

### AC 2: Profile Storage
- [x] JWT saved to `localStorage` via `AgentClient`.
- [x] Auto-used for requests.

### AC 3: Disconnect
- [x] Disconnect clears session.

## Design & Implementation

### Component Structure
- **`AgentConnectionPanel.tsx`**: The login form.
- **`AgentClient.ts`**: Axios/Fetch wrapper managing the baseURL and headers.

## Dependencies
- Story 7.10 (Auth API).
