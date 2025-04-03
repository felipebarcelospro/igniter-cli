# Igniter CLI

<div align="center">
  <img src="https://img.shields.io/npm/v/@igniter-js/cli" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dm/@igniter-js/cli" alt="NPM Downloads" />
  <img src="https://img.shields.io/github/license/felipebarcelospro/igniter-js" alt="License" />
</div>

<br />

Code generation CLI for Igniter.js projects - the essential tool to boost productivity with [Igniter Framework](https://github.com/felipebarcelospro/igniter-js).

## Why Igniter CLI?

* **Feature-First Architecture**: Generate complete features with best practices and proper structure
* **Type Safety**: All generated code is fully typed with TypeScript
* **Best Practices**: Follows modern development patterns and industry standards
* **Framework Integration**: Seamlessly integrates with Next.js and the Igniter Framework
* **Developer Experience**: Intuitive commands and helpful error messages
* **Productivity Boost**: Automates repetitive tasks and enforces consistency
* **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux

## 📦 Installation

```bash
# Global installation (recommended)
npm install -g @igniter-js/cli

# Or using npx for one-time execution
npx @igniter-js/cli
```

## 🚀 Quick Start

```bash
# Initialize a new project with Igniter Framework in the current directory
igniter init

# Initialize a new project in a specific directory
igniter init -d my-igniter-app

# Generate a new feature
igniter generate feature -n users

# Generate features from Prisma models
igniter generate feature
```

## 🛠️ Available Commands

### `init`

Initializes a new Next.js project with the complete Igniter Framework structure:

```bash
# Initialize in the current directory
igniter init

# Initialize in a specific directory (creates the directory if it doesn't exist)
igniter init -d my-igniter-app
```

Options:
- `-d, --dir <directory>`: Directory to initialize the project in

This command:
- Creates a Next.js application with TypeScript, Tailwind, and ESLint
- Sets up the recommended folder structure for Igniter Framework
- Initializes Prisma ORM
- Configures testing environment with Vitest
- Installs and configures Shadcn/UI
- Creates necessary Igniter Framework files
- Sets up Docker for development

### `analyze`

Analyzes the current project:

```bash
igniter analyze
```

This command checks your project's structure and configuration, providing insights and optimization suggestions.

### `generate feature` (alias: `g`)

Generates a complete feature:

```bash
# Generate a specific feature
igniter generate feature -n users

# Generate a feature with specific fields
igniter generate feature -n products -f name:string price:number

# Generate multiple features from Prisma models
igniter generate feature
```

This command:
- Creates the feature folder structure
- Generates base files (controller, procedures, interfaces)
- Configures the feature based on Prisma model if available

## 🏗️ Generated Project Structure

```
src/
├── app/                                  # Application routes
    ├── configs/                          # Global configurations
    ├── core/
    │   ├── design-system/                # Shadcn/UI components
    │   ├── utils/                        # Utility functions
    │   ├── providers/                    # Contexts and providers
    │   ├── factories/                    # Base classes
  ├── igniter.ts                          # Core initialization
  ├── igniter.client.ts                   # Client implementation
  ├── igniter.context.ts                  # Context management
  ├── igniter.router.ts                   # Router configuration
  ├── features/                           # Application features
  │   └── [feature]/
  │       ├── presentation/               # Feature presentation layer
  │       │   ├── components/             # Feature-specific components
  │       │   ├── hooks/                  # Custom hooks
  │       │   ├── contexts/               # Feature contexts
  │       │   └── utils/                  # Utility functions
  │       ├── controllers/                # Feature controllers
  │       │   └── [feature].controller.ts
  │       ├── procedures/                 # Feature procedures/middleware
  │       │   └── [feature].procedure.ts
  │       ├── [feature].interfaces.ts     # Type definitions
  │       └── index.ts                    # Feature exports
```

## 🔄 Platform Compatibility

Igniter CLI is designed to work seamlessly across different platforms:

- **Windows**: Full compatibility with Windows command prompt and PowerShell
- **macOS/Linux**: Native support for Unix-based terminals
- **Path handling**: Automatic path normalization across different operating systems
- **Terminal output**: Adaptive terminal styling based on platform capabilities

The CLI automatically detects your operating system and adjusts its behavior accordingly to ensure a consistent experience.

## 🔧 Advanced Configuration

The Igniter CLI can be configured through environment variables:

```bash
# Example of advanced configuration
IGNITER_TEMPLATE_DIR=/path/to/templates igniter generate feature -n custom
```

## 📚 Complete Documentation

For complete Igniter Framework documentation, visit our [official documentation](https://github.com/felipebarcelospro/igniter-js).

## 🤝 Contributing

Contributions are welcome! Please read our [contribution guide](CONTRIBUTING.md) to learn how to participate.

## 📄 License

This project is licensed under the [MIT License](LICENSE).