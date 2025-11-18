# Test Suite Documentation

This directory contains the test suite for the `net-pack-parser` project, built with [Playwright](https://playwright.dev/).

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Copy the `.env.example` file to a new file named `.env` and fill in the required environment variables:
    ```bash
    cp .env.example .env
    ```

3.  **Install Playwright Browsers**:
    ```bash
    npx playwright install --with-deps
    ```

## Running Tests

-   **Run all tests**:
    ```bash
    npm run test:e2e
    ```

-   **Run in headed mode**:
    ```bash
    npm run test:e2e -- --headed
    ```

-   **Run a specific test file**:
    ```bash
    npm run test:e2e -- tests/e2e/example.spec.ts
    ```

-   **Run in debug mode**:
    ```bash
    npm run test:e2e -- --debug
    ```

-   **View the HTML report**:
    ```bash
    npx playwright show-report test-results/html
    ```

## Architecture

-   **`tests/e2e/`**: Contains the end-to-end test files.
-   **`tests/support/`**: Contains the testing infrastructure.
    -   **`fixtures/`**: Test fixtures for setting up and tearing down test data. The `mergeTests` pattern is used for composable fixtures.
    -   **`factories/`**: Data factories for creating test data (e.g., users, products) using `@faker-js/faker`.
    -   **`helpers/`**: Utility functions that can be shared across tests.
    -   **`page-objects/`**: Page Object Models (POMs) for encapsulating page-specific logic (optional, but recommended for larger projects).

## Best Practices

-   **Selectors**: Use `data-testid` attributes for selecting elements to avoid brittle tests.
-   **Test Isolation**: Each test should be independent and not rely on the state of previous tests. Use the data factories and fixtures to create the necessary data for each test.
-   **Cleanup**: The provided fixture architecture includes an auto-cleanup mechanism to delete any data created during the test run.
-   **Network-First**: Use the network-first pattern (intercepting network requests before actions) to create deterministic tests that don't rely on arbitrary waits.

## CI/CD Integration

The tests are configured to run in a CI/CD environment. The pipeline is defined in `.github/workflows/test.yml`. It includes stages for linting, parallel test execution, and reporting.
