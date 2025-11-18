# CI Secrets Checklist

This document lists the required secrets for the CI/CD pipeline.

## Required Secrets

| Secret Name     | Description                                      | Where to Configure        |
| --------------- | ------------------------------------------------ | ------------------------- |
| `SLACK_WEBHOOK` | The webhook URL for sending Slack notifications. | GitHub Repository Secrets |

## Security Best Practices

-   Do not store secrets directly in the CI configuration file.
-   Use a secrets management tool (e.g., HashiCorp Vault, AWS Secrets Manager) for production environments.
-   Rotate secrets regularly.
-   Limit access to secrets to only the necessary personnel and services.
