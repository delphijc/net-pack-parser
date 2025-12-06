# Story 7.10: JWT Authentication & Token Management

**Story ID:** 7.10
**Epic:** 7 (Server-Side Capture Agent)
**Status:** Ready for Development

## User Story

As a security-conscious user,
I want the agent to require authentication,
So that unauthorized users cannot sniff traffic on my network interfaces.

## Acceptance Criteria

### AC 1: Login Endpoint
- [ ] `POST /api/auth/login` accepts `{ username, password }`.
- [ ] Returns `{ token: string }` (JWT) on success.

### AC 2: Middleware
- [ ] `authMiddleware` verifies the `Authorization: Bearer <token>` header.
- [ ] Returns 401 Unauthorized if missing/invalid.

### AC 3: Configuration
- [ ] Initial username/password configured via Environment Variables or a config file.

## Design & Implementation

### Component Structure
- **`AuthController.ts`**: Handle login.
- **`authMiddleware.ts`**: Verify JWT.

### Libraries
- `jsonwebtoken`.

## Dependencies
- Story 7.9.
