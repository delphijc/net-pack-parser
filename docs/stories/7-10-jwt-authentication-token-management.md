# Story 7.10: JWT Authentication & Token Management

**Story ID:** 7.10
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Done

## User Story

As a security-conscious user,
I want the agent to require authentication,
So that unauthorized users cannot sniff traffic on my network interfaces.

## Acceptance Criteria

### AC 1: Login Endpoint
- [x] `POST /api/auth/login` returns JWT.
- [x] Accepts `{ username, password }`.

### AC 2: Middleware
- [x] `authMiddleware` verifies Bearer token.
- [x] Returns 401 if invalid.

### AC 3: Configuration
- [x] Credentials via `JWT_SECRET` env var.

## Design & Implementation

### Component Structure
- **`AuthController.ts`**: Handle login.
- **`authMiddleware.ts`**: Verify JWT.

### Libraries
- `jsonwebtoken`.

## Dependencies
- Story 7.9.
