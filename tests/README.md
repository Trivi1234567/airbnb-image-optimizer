# Testing Guide

This document provides comprehensive information about the testing setup for the Airbnb Image Optimizer application.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
├── integration/             # Integration tests for service orchestration
├── e2e/                    # End-to-end tests with Playwright
│   ├── optimization-flow.spec.ts
│   ├── accessibility.spec.ts
│   └── performance.spec.ts
├── setup.ts                # Test setup configuration
└── README.md              # This file
```

## Test Types

### 1. Unit Tests
- **Location**: `tests/unit/` and `src/**/*.test.ts`
- **Purpose**: Test individual functions, components, and classes in isolation
- **Framework**: Jest + React Testing Library
- **Coverage**: Aim for 80%+ code coverage

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test service orchestration and API endpoints
- **Framework**: Jest
- **Focus**: Full flow from URL submission to download

### 3. End-to-End Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user journeys
- **Framework**: Playwright
- **Coverage**: User flows, error scenarios, accessibility, performance

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests Only
```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

### CI Tests
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Environment**: Node.js
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Setup**: `jest.setup.js`

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3000`
- **Retries**: 2 in CI, 0 locally

## Test Data and Mocking

### API Mocking
- Use Playwright's `page.route()` for API mocking
- Mock external services (Apify, Gemini) in integration tests
- Use Jest mocks for unit tests

### Test Data
- Use consistent test data across all test types
- Mock images with base64 data
- Use realistic Airbnb URLs for testing

## Coverage Requirements

### Unit Tests
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Integration Tests
- Cover all API endpoints
- Test error scenarios
- Verify service orchestration

### E2E Tests
- Complete user journeys
- Error handling
- Accessibility compliance
- Performance benchmarks

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One assertion per test
4. **Mock External Dependencies**: Don't make real API calls
5. **Clean Up**: Reset state between tests

### Test Organization
1. **Group Related Tests**: Use `describe` blocks
2. **Setup and Teardown**: Use `beforeEach` and `afterEach`
3. **Shared Utilities**: Create helper functions for common operations
4. **Test Data**: Use factories for consistent test data

### Performance
1. **Parallel Execution**: Run tests in parallel when possible
2. **Fast Feedback**: Keep unit tests fast (< 100ms each)
3. **Selective Testing**: Run only relevant tests during development
4. **CI Optimization**: Use test result caching

## Debugging Tests

### Unit Tests
```bash
npm run test:watch -- --verbose
```

### E2E Tests
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
DEBUG=pw:api npm run test:e2e
```

## Continuous Integration

### GitHub Actions
- **Lint**: ESLint and TypeScript checks
- **Unit Tests**: Jest with coverage
- **Integration Tests**: Service orchestration tests
- **E2E Tests**: Playwright tests
- **Performance**: Lighthouse CI
- **Security**: npm audit and Snyk

### Pre-commit Hooks
- Lint staged files
- Run unit tests
- Check test coverage

## Troubleshooting

### Common Issues

1. **Tests Timing Out**
   - Increase timeout in test configuration
   - Check for async operations not being awaited

2. **Mock Not Working**
   - Ensure mocks are set up before the code runs
   - Check mock implementation matches expected interface

3. **E2E Tests Failing**
   - Check if application is running
   - Verify selectors are correct
   - Check for race conditions

4. **Coverage Not Meeting Threshold**
   - Add more test cases
   - Check for untested code paths
   - Review coverage report for gaps

### Getting Help
- Check test logs for error messages
- Use debug mode for detailed output
- Review test documentation
- Ask team for assistance

## Test Maintenance

### Regular Tasks
1. **Update Tests**: When adding new features
2. **Review Coverage**: Ensure coverage thresholds are met
3. **Update Mocks**: When APIs change
4. **Performance Monitoring**: Track test execution time
5. **Clean Up**: Remove obsolete tests

### Test Review
1. **Code Review**: Include test changes in PRs
2. **Test Quality**: Ensure tests are maintainable
3. **Coverage**: Verify adequate test coverage
4. **Performance**: Check test execution time

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)