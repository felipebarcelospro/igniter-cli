export const PROJECT_STRUCTURE = {
  '.github': [],
  'src/configs': ['.gitkeep'],
  'src/lib': ['.gitkeep'],
  'src/providers': ['.gitkeep'],
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
  { name: 'docker-compose.yml', template: 'docker-compose' },
]

export const INTERACTIVE_COMMANDS = [] as const
