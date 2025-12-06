# Story 7.12: Connection Profile Management (Browser)

**Story ID:** 7.12
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a user,
I want to save my server connection details (URL, API Key) in the browser,
So that I don't have to re-type them every time I open the app.

## Acceptance Criteria

### AC 1: Connection Form
- [ ] UI provides inputs for: Agent URL (e.g., `https://192.168.1.5:3000`), Username, Password.
- [ ] Connect button initiates Auth flow (Story 7.10).

### AC 2: Profile Storage
- [ ] "Remember Me" option saves the URL and JWT (securely) to `localStorage` (or `sessionStorage`).
- [ ] JWT is automatically used for subsequent requests.

### AC 3: Disconnect
- [ ] "Disconnect" button clears the session state.

## Design & Implementation

### Component Structure
- **`AgentConnectionPanel.tsx`**: The login form.
- **`AgentClient.ts`**: Axios/Fetch wrapper managing the baseURL and headers.

## Dependencies
- Story 7.10 (Auth API).
