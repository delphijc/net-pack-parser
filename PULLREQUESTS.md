# Pull Request Guidelines

## Before Submitting

- [ ] Read the [Contributing Guidelines](CONTRIBUTING.md)
- [ ] Search for existing PRs to avoid duplicates
- [ ] Create an issue first for significant changes
- [ ] Fork the repository and create a feature branch

## PR Checklist

Before submitting your PR, ensure:

- [ ] Code compiles without errors: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] New code has tests (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## How Has This Been Tested?
Describe tests you ran to verify changes.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

## Branch Naming

Use descriptive branch names:

```
feat/threat-detection-dns-tunneling
fix/memory-leak-packet-buffer
docs/api-documentation
refactor/timeline-component
```

## Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
| ---- | ----------- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(threats): add DNS tunneling detection

Implements pattern matching for suspicious DNS queries
that may indicate data exfiltration.

Closes #123
```

## Review Process

1. **Automated checks** run on all PRs
2. **Maintainer review** within 1-2 weeks
3. **Address feedback** via new commits or discussions
4. **Merge** after approval

### Review Criteria

- Code quality and readability
- Test coverage for new functionality
- Documentation for public APIs
- No regressions in existing tests
- Adherence to project conventions

## After Merge

- Delete your feature branch
- Update any related issues
- Consider writing a blog post for significant features!

## Need Help?

- Comment on your PR for guidance
- Join [GitHub Discussions](https://github.com/delphijc/net-pack-parser/discussions)
- Reach out to maintainers

---

Thank you for contributing! 🎉
