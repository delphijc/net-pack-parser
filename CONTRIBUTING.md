# Contributing to Net Pack Parser

Thank you for your interest in contributing to Net Pack Parser! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check [existing issues](https://github.com/delphijc/net-pack-parser/issues) to avoid duplicates.

When creating a bug report, include:
- A clear, descriptive title
- Steps to reproduce the behavior
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node.js version, browser)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Provide a clear use case
- Explain how it benefits other users

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: 
   ```bash
   cd client && npm install --legacy-peer-deps
   cd ../server && npm install
   ```
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Run tests**: `cd client && npm test`
6. **Run builds**: 
   ```bash
   cd client && npm run build
   cd ../server && npm run build
   ```
7. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js 22.x or higher
- npm

### Getting Started

```bash
# Clone the repository
git clone https://github.com/delphijc/net-pack-parser.git
cd net-pack-parser

# Install client dependencies
cd client
npm install --legacy-peer-deps

# Install server dependencies
cd ../server
npm install

# Start development servers
cd ../client && npm run dev  # Terminal 1
cd ../server && npm run start  # Terminal 2
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use explicit types (avoid `any`)

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable/function names
- Add JSDoc comments for public APIs

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add threat detection for DNS tunneling
fix: resolve memory leak in packet buffer
docs: update API documentation
test: add unit tests for hex dump viewer
```

### File Structure

```
client/
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── services/      # Business logic
│   ├── store/         # State management
│   ├── types/         # TypeScript interfaces
│   └── utils/         # Helper functions
server/
├── src/
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   └── types/         # TypeScript interfaces
```

## Testing

- Write unit tests for utilities and services
- Write integration tests for components
- Aim for meaningful coverage, not 100%

```bash
cd client
npm test           # Run tests
npm run test:watch # Watch mode
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
