# CI/CD Pipeline Documentation

This document outlines the CI/CD pipeline for the `net-pack-parser` project, which is built using GitHub Actions.

## Pipeline Stages

The pipeline consists of the following stages:

1.  **Lint**: Checks the code for style and quality issues using ESLint.
2.  **Test**: Runs the Playwright end-to-end test suite in parallel across 4 shards to ensure fast execution.
3.  **Burn-in**: Runs the entire test suite 10 times in a loop to detect flaky tests. This stage runs only on pull requests to `main` or `develop`.
4.  **Report**: Aggregates test results and uploads artifacts (traces, screenshots, videos) on failure.

## How to Run Locally

To debug CI failures, you can run a local mirror of the CI pipeline:

```bash
./scripts/ci-local.sh
```

This script will run the linting, testing, and a reduced burn-in loop (3 iterations) on your local machine.

## Debugging Failed CI Runs

When a CI run fails, you can find the following artifacts in the "Artifacts" section of the GitHub Actions run:

-   **Traces**: A full trace of the test execution, including DOM snapshots, network requests, and console logs.
-   **Screenshots**: Screenshots of the application at the point of failure.
-   **Videos**: A video recording of the test execution.
-   **HTML Report**: A detailed HTML report of the test results.

## Secrets and Environment Variables

The CI pipeline requires the following secrets to be configured in the GitHub repository settings:

-   `SLACK_WEBHOOK` (optional): The webhook URL for sending notifications to a Slack channel on test failure.

The following environment variables are used:

-   `TEST_ENV`: The environment to run the tests against (e.g., `staging`).
-   `BASE_URL`: The base URL of the application under test.
-   `API_URL`: The base URL of the API.

## Badge URLs

You can add the following badge to your `README.md` to show the status of the CI pipeline:

```markdown
[![E2E Tests](https://github.com/<your-username>/net-pack-parser/actions/workflows/test.yml/badge.svg)](https://github.com/<your-username>/net-pack-parser/actions/workflows/test.yml)
```
