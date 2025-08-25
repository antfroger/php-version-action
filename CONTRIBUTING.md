# Contributing to PHP Version Action

This document provides guidelines and instructions for setting up the project locally and contributing to its
development.

## Prerequisites

- **Node.js**: Version 20 or higher (required by the project)
- **npm**: Usually comes with Node.js

## Local Development Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Package the TypeScript for distribution**

   ```bash
   npm run bundle
   ```

## Running Locally

To simulate the GitHub Action locally, you can use the `@github/local-action` package:

1. **Copy the existing `.env.example` file** in your project root:

   ```bash
   cp .env.example .env
   ```

2. **Run the action locally**:

   ```bash
   npm run local-action
   ```

3. **Test with different working directories** by modifying the `.env` file:

   ```bash
   # Test with a subdirectory
   echo "INPUT_WORKING-DIRECTORY=./test-dir" > .env
   npm run local-action
   ```

4. **For development with real-time changes**:

   ```bash
   # Build in watch mode
   npm run package:watch

   # In another terminal, run the local action
   npm run local-action
   ```

## Development Workflow

1. **Make Your Changes**
   - Edit files in the `src/` directory
   - Add tests in the `__tests__/` directory
   - Update documentation as needed

2. **Test Your Changes**

   ```bash
   # Run tests
   npm test

   # Prepare to commit (Check code quality, Format code, Build the project, etc.)
   npm run all
   ```

3. Open a Pull Request

## Testing

The project uses Jest for testing. Tests are located in the `__tests__/` directory.

- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm test -- --watch`
- **Generate coverage report**: `npm run coverage`

### Test Structure

- `main.test.ts` - Tests for the main action logic
- `versions.test.ts` - Tests for version parsing and validation
- `testdata/` - Test fixtures and sample data
- `__fixtures__/` - Test mocks

## Code Quality

The project enforces code quality through several tools:

### ESLint

- Configuration: `eslint.config.mjs`
- Run: `npm run lint`
- Autofix: `npm run lint -- --fix`

### Prettier

- Configuration: `.prettierrc` (inherited from eslint-config-prettier)
- Check formatting: `npm run format:check`
- Format code: `npm run format:write`

### TypeScript

- Configuration: `tsconfig.json`
- The project is written in TypeScript and compiled to JavaScript
- Type checking is integrated into the build process

## Submitting Changes

1. **Create a Pull Request**
   - Fill out the PR template with:
     - Description of changes
     - Related issues
     - Testing performed
     - Any breaking changes

2. **PR Review Process**
   - Ensure all CI checks pass
   - Address any review comments
   - Maintainers will review and merge when ready

## License

By contributing to PHP Version Action, you agree that your contributions will be licensed under the MIT License.
