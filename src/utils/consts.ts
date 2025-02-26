export const PROJECT_STRUCTURE = {
  docs: ['.gitkeep'],
  public: [],
  scripts: ['.gitkeep'],
  '.github/actions': ['.gitkeep'],
  'src/configs': ['.gitkeep'],
  'src/core/design-system': [],
  'src/core/utils': [],
  'src/core/providers': [],
  'src/features': ['.gitkeep'],
}

export const LIA_FILES = {
  'project_requirement.md': '',
  'detailed_app_flow.md': '',
  'tech_stack_and_packages.md': '',
  'file_structure.md': '',
  'schema_design.md': ''
}

export const DEPENDENCIES = {
  required: ['docker', 'node', 'npm'],
}

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
