**Actionable Intelligence for Story 1.8 (Protocol Detection & Classification):**

1.  **Reuse and Align with `pcapParser.ts` and `packet.ts`:** Story 1.7 significantly modified `client/src/services/pcapParser.ts` to integrate string extraction and `client/src/types/packet.ts` to include `extractedStrings`. Story 1.8 will need to extend `pcapParser.ts` to include protocol detection logic and update the `Packet` interface (or a new related interface) to store protocol information. Adherence to existing code patterns in these files is crucial.

2.  **Performance Awareness:** While direct regex matching might be less central to initial protocol detection, deep packet inspection for common protocols could involve pattern matching. Consider applying the Web Worker pattern from Story 1.7 (`stringExtractionWorker.ts`) if complex or CPU-intensive deep packet inspection is required for very large packet payloads, to avoid blocking the UI thread. The warnings from Story 1.7 regarding performance with large inputs are still relevant for any new heavy processing.

3.  **Data Model Cleanliness:** The `review_findings` from Story 1.7 about a "Redundant Category Field" in `ExtractedString` serve as a reminder to ensure the data model for `Packet` and any new protocol-related types is concise and avoids unnecessary duplication when adding protocol classification information.

4.  **Adhere to Testing Standards:** Story 1.7 introduced new unit and component test files (`.test.ts`, `.test.tsx`). Story 1.8 should continue this practice, creating dedicated test files for new protocol detection logic and UI components (e.g., protocol filter dropdown, protocol distribution chart).

**Project Structure Alignment:**
The previous story reinforced the project's modular structure:
- Core logic utilities (like `stringExtractor.ts`) reside in `client/src/utils/`.
- UI components (`ExtractedStringsTab.tsx`, `PacketDetailView.tsx`) are in `client/src/components/`.
- Web Workers (`stringExtractionWorker.ts`) are used for offloading heavy tasks.
Story 1.8 should follow these conventions, placing protocol detection logic within `client/src/utils/` (potentially extending or creating a new module related to `pcapParser.ts`) and any new UI elements (like a protocol filter or chart) in `client/src/components/`. The `Packet` type in `client/src/types/packet.ts` will need to be extended to store detected protocol information.