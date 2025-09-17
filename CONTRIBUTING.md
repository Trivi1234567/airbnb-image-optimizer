# Contributing to Airbnb Image Optimizer

Thank you for your interest in contributing to the Airbnb Image Optimizer! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Git
- Docker (optional, for containerized development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/airbnb-optimizer-v2.git
   cd airbnb-optimizer-v2
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-owner/airbnb-optimizer-v2.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp env.example .env.local
```

Configure your environment variables:
```bash
# Required API keys
APIFY_TOKEN=your_apify_token_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### 5. Docker Development (Optional)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── application/           # Application layer
│   ├── dto/              # Data Transfer Objects
│   └── use-cases/        # Business logic
├── domain/               # Domain layer
│   ├── entities/         # Domain entities
│   ├── repositories/     # Repository interfaces
│   └── services/         # Service interfaces
├── infrastructure/       # Infrastructure layer
│   ├── config/          # Configuration
│   ├── di/              # Dependency injection
│   ├── middleware/      # Express middleware
│   ├── monitoring/      # Monitoring services
│   ├── repositories/    # Repository implementations
│   └── services/        # Service implementations
└── presentation/        # Presentation layer
    ├── components/      # React components
    └── hooks/          # Custom hooks

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── e2e/                # End-to-end tests

docs/
├── api/                # API documentation
├── architecture/       # Architecture documentation
└── deployment/         # Deployment guides
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use enums for constants

### Code Style

- Use ESLint and Prettier for consistent formatting
- Follow the existing code style
- Use meaningful variable and function names
- Write self-documenting code
- Add JSDoc comments for public APIs

### File Naming

- Use kebab-case for file names
- Use PascalCase for component files
- Use camelCase for utility files
- Use descriptive names that indicate purpose

### Import/Export

- Use named exports for utilities and functions
- Use default exports for components
- Group imports: external libraries, internal modules, relative imports
- Sort imports alphabetically

## Testing Guidelines

### Unit Tests

- Write unit tests for all business logic
- Aim for 80%+ code coverage
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies

### Integration Tests

- Test API endpoints end-to-end
- Test service integrations
- Use real external services in test environment
- Test error scenarios and edge cases

### E2E Tests

- Test complete user workflows
- Test cross-browser compatibility
- Test responsive design
- Test accessibility features

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Test implementation
    });
  });
});
```

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Write your code following the coding standards
- Add tests for new functionality
- Update documentation if needed
- Ensure all tests pass

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub with:
- Clear title and description
- Reference related issues
- Add screenshots for UI changes
- Request review from maintainers

### 5. PR Review Process

- Address review feedback
- Update tests if needed
- Ensure CI passes
- Squash commits if requested

## Issue Reporting

### Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment information
- Screenshots or error messages

### Feature Requests

When requesting features, include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation approach
- Any relevant mockups or examples

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch
4. Run full test suite
5. Create GitHub release
6. Deploy to production

## Development Workflow

### Daily Workflow

1. Pull latest changes from upstream
2. Create feature branch
3. Make changes and test
4. Commit and push
5. Create pull request

### Weekly Workflow

1. Review and merge pull requests
2. Update dependencies
3. Run security audit
4. Review and update documentation

### Monthly Workflow

1. Review performance metrics
2. Update monitoring dashboards
3. Plan next month's features
4. Review and update architecture

## Getting Help

### Documentation

- Check the [README](README.md) for basic setup
- Review [API documentation](docs/api/) for API usage
- Read [architecture docs](docs/architecture/) for system design

### Community

- Join our Discord server
- Follow us on Twitter
- Star the repository

### Support

- Create an issue for bugs or questions
- Use discussions for general questions
- Contact maintainers for urgent issues

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Social media announcements

Thank you for contributing to the Airbnb Image Optimizer! 🚀
