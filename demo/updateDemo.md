# Protocol: Updating the Demo Guide

This document outlines the standard operating procedure (SOP) for analyzing newly completed stories and updating `demo.md` to ensure the demo script remains a comprehensive showcase of the application's capabilities.

## Workflow Overview

1.  **Identify Completed Stories**: Check `docs/stories/sprint-status.yaml` or the `docs/stories/` directory for stories marked as `done`.
2.  **Analyze Story Artifacts**: Read the `.md` file for each completed story to understand the implemented Functional Requirements (FRs).
3.  **Extract Demoable Features**: Identify specific UI interactions, visual indicators, or workflows that can be demonstrated.
4.  **Map to Demo Structure**: Determine where these features fit within the existing `demo.md` flow (e.g., Filtering, Deep Inspection, Forensics).
5.  **Update `demo.md`**: Add clear, actionable steps for the user.

## Detailed Steps

### 1. Identify Completed Stories
Run the following to list stories and check their status:
```bash
ls docs/stories/
# Check the status header in the files or look at sprint-status.yaml
```
Focus on stories that have *just* been completed in the current sprint.

### 2. Analyze Story Artifacts
For each story (e.g., `1-9-file-reference-detection-download.md`), look for:
*   **Acceptance Criteria (AC)**: These often describe the exact user-facing behavior (e.g., "User clicks Download button", "System displays SHA-256 hash").
*   **Tasks**: Look for implementation details like "Create `FilesTab.tsx`" or "Add `HexDumpViewer`".
*   **User Interface Updates**: Any mention of new Tabs, Buttons, Icons, or Panels is a prime candidate for a demo step.

### 3. Extract Demoable Features
Create a short list of "Demo Scripts" for the features.
*   *Example*: Story 1.9 -> "Navigate to Files tab", "Verify file list", "Click Download".
*   *Example*: Story 2.1 -> "Enter `tcp port 80` in Filter Bar", "Verify list updates".

### 4. Map to Demo Structure
Decide where the new steps belong in `demo.md`:
*   **Setup / Ingestion**: File Upload, Hashing, Initial Parsing.
*   **High-Level Analysis**: Dashboard, Protocol Charts.
*   **Packet List Interaction**: Filtering (BPF), Searching, Sorting.
*   **Deep Inspection**: Packet Details, Hex Dump, Extracted Strings, File Extraction.
*   **Threat Intelligence**: Specific alerts (SQLi, XSS, IOCs).
*   **Forensics / Management**: Chain of Custody, Import/Export, Settings.

### 5. Update `demo.md`
Edit `demo/demo.md` to insert the new steps.
*   **Style**: Use bold text for UI elements (e.g., **"Filter Bar"**) and code blocks for inputs.
*   **Verifiability**: Always explicitly state what the user should *see* (e.g., "Verify the shield icon appears", "Verify the list is filtered").
*   **Prerequisites**: If a feature requires specific data in the PCAP, ensure the `demo.pcap` supports it (or note it for the `demo.pcap` generation task).

## Example Update

**New Story**: *Story 2.2 Multi-Criteria Search*
**Extracted Feature**: Advanced Search Panel with "Payload Contains".

**Update to `demo.md`**:
```markdown
## Step 2: Search & Filtering
...
3. **Multi-Criteria Search**:
   *   Open **"Advanced Search"**.
   *   Set **Payload Contains** to `password`.
   *   Click **"Search"**. Verify matching packets are highlighted.
```
