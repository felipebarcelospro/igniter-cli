export const PROJECT_STRUCTURE = {
  docs: ['.gitkeep'],
  public: [],
  scripts: ['.gitkeep'],
  '.github/actions': ['.gitkeep'],
  'src/configs': ['.gitkeep'],
  'src/core/design-system': [],
  'src/core/utils': [],
  'src/core/providers': [],
  'src/app/api/[[...all]]': [],
  'src/features': ['.gitkeep'],
}



export const DEPENDENCIES = {
  required: ['docker', 'node', 'npm'],
}

export const LIA_FILES = [
  { name: '.github/copilot.feature.instructions.md', template: 'copilot.feature.instructions.hbs' },
  { name: '.github/copilot.igniter.instructions.md', template: 'copilot.igniter.instructions.hbs' },
  { name: '.github/copilot.instructions.md', template: 'copilot.instructions.hbs' },
  { name: '.github/copilot.next.instructions.md', template: 'copilot.next.instructions.hbs' },
  { name: '.github/copilot.review.instructions.md', template: 'copilot.review.instructions.hbs' },
  { name: '.github/copilot.test.instructions.md', template: 'copilot.test.instructions.hbs' },
  { name: '.github/copilot.form.instructions.md', template: 'copilot.form.instructions.hbs' },
  { name: '.vscode/settings.json', template: 'vscode.settings.hbs' }
]

export const CONFIG_FILES = [
  { name: 'README.md', template: 'readme' },
  { name: 'eslintrc.json', template: 'eslintrc' },
  { name: 'components.json', template: 'components.json' },
  { name: 'docker-compose.yml', template: 'docker-compose' },
  { name: 'vitest.config.ts', template: 'vitest.config' },
]

export const INTERACTIVE_COMMANDS = [
  'shadcn',
]
