# Story 3.2: XSS Pattern Detection

Status: done

## Story

As a security analyst,
I want automatic detection of Cross-Site Scripting (XSS) attempts,
so that I can identify potential client-side injection attacks.

## Acceptance Criteria

1.  Given HTTP traffic packets are loaded
2.  When the system analyzes packet payloads
3.  Then it detects XSS patterns:
    *   Script tags: `<script>`, `javascript:`, `onerror=`, `onload=`
    *   Event handlers: `onclick=`, `onmouseover=`, etc.
    *   Encoded patterns: HTML entity encoding, URL encoding
    *   Data URIs: `data:text/html,<script>`
    *   Polyglot XSS patterns
4.  And detected threats appear with:
    *   Severity: HIGH
    *   Type: Cross-Site Scripting (XSS)
    *   MITRE ATT&CK: T1059.007 (Command and Scripting Interpreter: JavaScript)
5.  And threats are highlighted in the packet payload view

## Tasks / Subtasks

- [x] **1. Implement XSS Pattern Detection Logic** (AC3)
  - [x] **1.1. Define XSS Patterns**:
    - [x] Research and define comprehensive regex patterns for script tags, event handlers, data URIs, and polyglots.
    - [x] Create `client/src/utils/xssPatterns.ts` to store these patterns.
  - [x] **1.2. Develop `xssDetector` Utility**:
    - [x] Create `detectXss(packet: Packet): ThreatAlert[]` in `client/src/utils/xssDetector.ts`.
    - [x] Implement decoding logic (URL, HTML entity) before pattern matching.
    - [x] Focus analysis on HTTP components (query strings, POST bodies, headers).
  - [x] **1.3. Integrate with Threat Detection Pipeline**:
    - [x] Update `client/src/utils/threatDetection.ts` to include `detectXss`.
    - [x] Ensure `ThreatAlert` objects are created with HIGH severity and correct MITRE ID (T1059.007).
    - [x] Verify `suspiciousIndicators` are correctly populated for `PacketList` visibility (Learning from 3.1).

- [x] **2. UI Integration & Verification** (AC4, AC5)
  - [x] **2.1. Verify Threat Panel Display**:
    - [x] Ensure XSS threats appear in `ThreatPanel` with correct metadata (Source/Dest IP, Timestamp).
  - [x] **2.2. Verify Pattern Highlighting**:
    - [x] Ensure `PacketDetailView` highlights detected XSS patterns in hex/ASCII view.
    - [x] Verify clicking a threat in `ThreatPanel` switches to Hex Dump view (Learning from 3.1).

- [x] **3. Testing**
  - [x] **3.1. Unit Tests**:
    - [x] Create `client/src/utils/xssDetector.test.ts` covering all pattern types and edge cases.
    - [x] Test decoding logic specifically.
  - [x] **3.2. Integration Tests**:
    - [x] Update `ThreatPanel.test.tsx` or create new test to verify XSS threat rendering.
  - [x] **3.3. Performance Check**:
    - [x] Verify regex performance on large payloads (avoid catastrophic backtracking).

- [x] **4. Code Quality**
  - [x] **4.1. Linting**:
    - [x] Run `npm run lint` and ensure no errors in new/modified files.
    - [x] Ensure strict type safety.

## Dev Notes

- **Relevant architecture patterns and constraints**:
  - Follow the pattern established in `sqlInjectionDetector.ts`.
  - Use `client/src/types/threat.ts` for `ThreatAlert` interface.
  - Ensure proper decoding (URL, HTML Entity) is handled *before* regex matching to catch obfuscated attacks.
  - MITRE ATT&CK: T1059.007.
  - Severity: HIGH.

- **Source tree components to touch**:
  - `client/src/utils/xssPatterns.ts` (NEW)
  - `client/src/utils/xssDetector.ts` (NEW)
  - `client/src/utils/threatDetection.ts` (MODIFY)
  - `client/src/utils/xssDetector.test.ts` (NEW)

- **Testing standards summary**:
  - Comprehensive unit tests for all regex patterns.
  - Integration tests for UI display.

### Project Structure Notes

- **Alignment**: Follows standard utility/component structure.
- **Naming**: `xssDetector`, `xssPatterns` (camelCase).

### References

- [Source: docs/stories/tech-spec-epic-3.md#Story 3.2: XSS Pattern Detection]
- [Source: docs/epics.md#Story 3.2: XSS Pattern Detection]
- [Source: docs/stories/3-1-sql-injection-pattern-detection.md]

### Learnings from Previous Story

**From Story 3.1: SQL Injection Pattern Detection (Status: done)**

- **New Service Created**: `sqlInjectionDetector` utility. `xssDetector` should follow this exact structure.
- **Architectural Change**: `ThreatAlert` interface now includes `sourceIp` and `destIp`. Ensure these are populated in `xssDetector`.
- **Critical Fixes**:
    - `PacketList` visibility: Ensure threats map to `suspiciousIndicators` so the shield icon appears.
    - `PacketDetailView` interaction: Clicking a threat must switch to the Hex Dump tab.
- **Linting**: Strict adherence to linting rules is required. Run `npm run lint -- --fix` early.
- **Testing**: Unit tests must cover edge cases (false positives).

[Source: stories/3-1-sql-injection-pattern-detection.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- [Context File](docs/stories/3-2-xss-pattern-detection.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- client/src/utils/xssPatterns.ts
- client/src/utils/xssDetector.ts
- client/src/utils/threatDetection.ts
- client/src/utils/xssDetector.test.ts
- client/src/components/ThreatPanel.xss.test.tsx


## Senior Developer Review (AI)

### Reviewer
delphijc (AI Agent)

### Date
2025-12-04

### Outcome
**Approve**

### Summary
The implementation of XSS pattern detection is robust and follows the established patterns. Comprehensive regex patterns cover script tags, event handlers, and encoded payloads. The integration with the threat detection pipeline and UI is verified. Unit and integration tests provide good coverage.

### Key Findings
- **High Severity**: None.
- **Medium Severity**: None.
- **Low Severity**: None.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Detect XSS patterns | IMPLEMENTED | `client/src/utils/xssPatterns.ts` |
| 2 | Threats appear with HIGH severity, Type XSS, MITRE T1059.007 | IMPLEMENTED | `client/src/utils/xssDetector.ts` |
| 3 | Threats are highlighted in packet payload view | IMPLEMENTED | `client/src/components/PacketDetailView.tsx` (via `matchDetails`) |
| 4 | UI Integration (Threat Panel) | IMPLEMENTED | `client/src/components/ThreatPanel.xss.test.tsx` |
| 5 | Pattern Highlighting | IMPLEMENTED | `client/src/utils/xssDetector.ts` (populates `matchDetails`) |

**Summary**: 5 of 5 acceptance criteria fully implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| :--- | :--- | :--- | :--- |
| 1. Implement XSS Pattern Detection Logic | [x] | VERIFIED COMPLETE | `client/src/utils/xssDetector.ts` |
| 2. UI Integration & Verification | [x] | VERIFIED COMPLETE | `client/src/components/ThreatPanel.xss.test.tsx` |
| 3. Testing | [x] | VERIFIED COMPLETE | `client/src/utils/xssDetector.test.ts` |
| 4. Code Quality | [x] | VERIFIED COMPLETE | Lint checks passed |

**Summary**: 4 of 4 completed tasks verified.

### Test Coverage and Gaps
- **Unit Tests**: `client/src/utils/xssDetector.test.ts` covers all pattern types (script, event handlers, encoded, polyglot) and edge cases.
- **Integration Tests**: `client/src/components/ThreatPanel.xss.test.tsx` verifies UI rendering.
- **Gaps**: None identified.

### Architectural Alignment
- Follows the pattern of `sqlInjectionDetector.ts`.
- Reuses `ThreatAlert` interface.
- Client-side only implementation as required.

### Security Notes
- Regex patterns include common obfuscation techniques.
- Decoding logic (URL, HTML Entity) is applied before matching.

### Best-Practices and References
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

### Action Items
**Code Changes Required:**
None.

**Advisory Notes:**
- Note: Regular updates to XSS patterns may be needed as new vectors are discovered.
