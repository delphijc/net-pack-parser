# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Do NOT

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### Do

1. **Email the maintainers** at [security@example.com] with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

2. **Allow reasonable time** for us to address the issue before any public disclosure

3. **Provide a valid email address** so we can contact you for follow-up questions

## Response Timeline

| Action | Timeline |
| ------ | -------- |
| Initial response | Within 48 hours |
| Issue confirmation | Within 1 week |
| Patch release | Within 2 weeks (critical) / 4 weeks (other) |

## Security Best Practices

When deploying Net Pack Parser:

### Server Configuration

- **Use HTTPS/WSS** for all connections
- **Set strong JWT secrets** via environment variables
- **Run with minimal privileges** - avoid running as root
- **Keep dependencies updated** regularly

### Network Security

- **Limit network interfaces** exposed for capture
- **Use BPF filters** to capture only necessary traffic
- **Secure the server** behind a firewall

### Data Handling

- **PCAP files contain sensitive data** - handle accordingly
- **Enable session cleanup** to avoid data accumulation
- **Encrypt at rest** if storing captures long-term

## Known Security Considerations

### PCAP Data

This tool captures and displays network packets. Captured data may contain:
- Passwords and credentials (if unencrypted)
- Personal information
- Proprietary data

Handle captured data with appropriate care according to your organization's policies.

### Web Worker Isolation

Threat detection runs in Web Workers for isolation, but this is not a security boundary. Do not analyze malicious files on production systems.

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve this project (unless they prefer to remain anonymous).
