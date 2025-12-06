# Data Storage Evaluation & Cleanup Guide

This guide identifies where the Network Traffic Parser project stores data and provides instructions for manual cleanup to prevent accidental commitment of sensitive information.

## 1. File System Storage (Git-tracked)

These locations contain files that **are part of the project structure** and can be committed to version control.

### 🔴 High Risk: Demo & Capture Files
The most significant risk for committing sensitive data is the inclusion of `.pcap` files in the repository.

*   **Location:** `demo/` directory (e.g., `demo/en0.pcap`, `demo/demo.pcap`) and potentially the project root.
*   **Current State:** `demo/en0.pcap` (13MB) is present. `demo/` is **not** likely ignored by default in a way that prevents these from being tracked if they were added previously or if new ones are added without updating `.gitignore`.
*   **Manual Cleanup:**
    *   Delete any `.pcap` files from `demo/` or the root directory before committing, unless they are non-sensitive public samples.
    *   **Recommendation:** Update `.gitignore` to include `*.pcap` to prevent future accidents.

### 🟡 Low Risk: Generated Reports
*   **Location:** `docs/project-scan-report.json`
*   **Current State:** Contains project metadata (paths, file counts), not packet data.
*   **Manual Cleanup:** Review contents if path names are sensitive. Generally safe to commit.

### 🟢 Safe/Ignored: Test Artifacts
*   **Location:** `test_results/`
*   **Current State:** This directory is already in `.gitignore`.

---

## 2. Browser Storage (Local Environment)

This data is stored **locally in your web browser** (Chrome, Firefox, etc.). It is **NOT** tracked by git and cannot be "committed" to the repository. However, it persists between sessions on your machine.

### 🔹 IndexedDB (`networkParserDB` & `NetworkParserDB`)
*   **Stores:** Parsed packets, file references, timeline events, chain of custody logs.
*   **Sensitivity:** High (contains full packet payloads).

### 🔹 Local Storage (`npp` namespace)
*   **Stores:** Application settings, performance metrics, forensic cases, threat intelligence, capture sessions.

### 🧹 Manual Cleanup Instructions
To clear this data (e.g., to reset your environment or ensure no data lingers on a shared machine):

1.  **Using the App UI:**
    *   Navigate to the **Settings** page.
    *   Click the **"Clear Analysis Data"** button (Red).
    *   Confirm the dialog. This wipes both IndexedDB and relevant LocalStorage entries.

2.  **Using Browser DevTools:**
    *   Open Developer Tools (F12).
    *   Go to **Application** tab.
    *   Under **Storage**, right-click **IndexedDB** and select **Clear**.
    *   Right-click **Local Storage** and select **Clear**.

---

## Summary Checklist for Committing

Before running `git commit`:

1.  [ ] **CHECK** `git status` for any new `.pcap` files.
2.  [ ] **REMOVE** sensitive `.pcap` files from `demo/` or root.
3.  [ ] **VERIFY** you haven't modified `client/src/data/*.json` with real data (unless intended).

> **Note:** You do not need to worry about the data visible in the web application (packet list, details) being committed, as that lives strictly in your browser.
