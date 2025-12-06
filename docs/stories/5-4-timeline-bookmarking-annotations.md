# Story 5.4: Timeline Bookmarking & Annotations

**Story ID:** 5.4
**Epic:** 5 (Forensic Investigation & Timeline Analysis)
**Status:** Ready for Development

## User Story

As an analyst,
I want to bookmark specific packets and add notes to the timeline,
So that I can document key evidence and findings during my investigation.

## Acceptance Criteria

### AC 1: Add Bookmark
- [ ] User can click a packet or a timestamp on the timeline to add a bookmark.
- [ ] Bookmark appears visually on the timeline (e.g., a flag icon).

### AC 2: Add Annotations
- [ ] User can attach a text note to a bookmark.
- [ ] Notes are editable and persist.

### AC 3: Persistence
- [ ] Bookmarks and notes are saved to `ChainOfCustody` or local storage and persist across page reloads.

## Design & Implementation

### Component Structure
- **`BookmarkMarker.tsx`**: Visual element on the timeline chart.
- **`AnnotationPanel.tsx`**: Sidebar or Drawer to view/edit notes.

### Data Model
```typescript
interface Bookmark {
  id: string;
  timestamp: number;
  packetId?: string;
  note: string;
  author: string;
}
```

## Dependencies
- Story 5.2 (Timeline).
