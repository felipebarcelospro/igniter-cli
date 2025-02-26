# Contributing to Igniter CLI

Thank you for your interest in contributing to Igniter CLI! This guide provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all participants are expected to follow. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Ways to Contribute

There are several ways you can contribute to Igniter CLI:

### Reporting Bugs

If you find a bug, please open a GitHub issue following these steps:

1. Check if the bug has already been reported in existing issues
2. Use the available bug report template
3. Clearly describe the problem, including steps to reproduce
4. Include environment information (Node.js version, OS, etc.)
5. If possible, add code examples or screenshots

### Suggesting Features

To suggest improvements or new features:

1. Check if the suggestion already exists in issues
2. Use the available feature request template
3. Clearly describe your suggestion and its benefits
4. If possible, add examples of how the feature should work

### Contributing Code

To contribute code:

1. Fork the repository
2. Clone your fork locally
3. Create a branch for your changes: `git checkout -b feature/feature-name`
4. Implement your changes following the code guidelines below
5. Run `npm test` to ensure nothing breaks
6. Commit your changes following our [commit conventions](#commit-conventions)
7. Push to your fork: `git push origin feature/feature-name`
8. Open a Pull Request to the main repository

## Development Guidelines

### Setting Up the Environment

```bash
# Clone the repository
git clone https://github.com/felipebarcelospro/igniter-cli.git
cd igniter-cli

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Project Structure

```
src/
├── index.ts                # CLI entry point
├── docs/                   # CLI documentation
├── templates/              # Handlebars templates for code generation
├── utils/                  # Internal CLI utilities
```

### Code Conventions

- Use TypeScript for all code
- Maintain consistent formatting using ESLint and Prettier
- Write tests for new features
- Document public APIs and interfaces
- Follow the Feature-First architecture pattern
- Use meaningful variable and function names
- Keep functions small and focused
- Write clear, concise comments

### Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

Common types:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Changes that don't affect code (formatting, etc)
- `refactor:` Code changes that neither fix a bug nor add a feature
- `test:` Adding or correcting tests
- `chore:` Changes to build process, tools, etc.

Examples:
```
feat(generator): add support for custom fields
fix(init): resolve directory creation issue
docs: update README with new commands
```

## Review Process

All Pull Requests are reviewed by project maintainers. During review, we may request changes or clarification about your implementation.

Requirements for approval:
- Code follows style guidelines
- All tests pass
- Feature aligns with project goals
- Documentation is updated as needed
- CI/CD checks pass

## Releases

We follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible changes
- MINOR version for backwards-compatible features
- PATCH version for backwards-compatible bug fixes

## Development Best Practices

1. **Code Quality**
   - Write clean, readable code
   - Use TypeScript features effectively
   - Follow SOLID principles
   - Keep functions small and focused

2. **Testing**
   - Write unit tests for new features
   - Ensure existing tests pass
   - Add integration tests for CLI commands
   - Test edge cases and error scenarios

3. **Documentation**
   - Document new features and changes
   - Keep code comments clear and relevant
   - Update README when adding features
   - Include examples in documentation

4. **Performance**
   - Optimize code generation
   - Minimize dependencies
   - Consider CLI startup time
   - Handle large projects efficiently

## Questions?

If you have questions about contributing, feel free to:
- Open an issue with the "question" tag
- Contact project maintainers
- Join our community discussions

## Acknowledgments

Your contributions help make Igniter CLI better for everyone. Thank you for your support!