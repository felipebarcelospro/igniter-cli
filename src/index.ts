#!/usr/bin/env node
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs'

import { Command } from 'commander'
import { CONFIG_FILES, DEPENDENCIES, LIA_FILES, PROJECT_STRUCTURE } from './utils/consts'
import { CLIHelper } from './utils/helpers'
import { TemplateHandler } from './utils/template-handler'
import { registerHelpers } from './utils/handlebars-helpers'
import { PrismaSchemaParser } from './utils/prisma-schema-parser'
import { AnalyzeCommand } from './utils/analyze'
import { CLIStyle } from './utils/cli-style'
import { getPackageManagerRunner, isNextJSProject } from './utils/project-utils'
import { normalizePath } from './utils/platform-utils'

class IgniterCLI extends CLIHelper {
  private program: Command
  private schemaParser: PrismaSchemaParser
  private analyze: AnalyzeCommand

  constructor() {
    super()
    this.program = new Command()
    this.schemaParser = new PrismaSchemaParser()
    this.analyze = new AnalyzeCommand()
    this.setupCLI()
  }

  private setupCLI() {
    // Register handlebars helpers
    registerHelpers()

    this.program
      .name('igniter')
      .description('Feature-first code generator for Next.js projects')
      .version('1.0.0')

    this.program
      .command('init')
      .description('Initialize a new Next.js project with Igniter.js')
      .option('-d, --dir <directory>', 'Directory to initialize the project in')
      .action(async (options) => {
        await this.init(options.dir)
      })

    this.program
      .command('analyze')
      .description('Analyze your project')
      .action(async () => {
        await this.analyze.analyze()
      })

    this.program
      .command('generate feature')
      .alias('g')
      .description('Generate a new feature')
      .option('-n, --name <name>', 'Feature name')
      .option('-f, --fields <fields...>', 'Fields for the feature (format: name:type)')
      .option('-y, --yes', 'Automatically confirm creation if model is not found')
      .action(async (options, params) => {
        console.log(options, params)
        if (!params.name) {
          await this.generateAllFeatures()
          return
        }
        
        await this.generateFeature(params.name, params.fields || [], params.yes)
      })

    this.program.parse()
  }

  private async init(targetDir?: string) {
    console.clear()
    CLIStyle.startSequence('Welcome to Igniter.js CLI')
    CLIStyle.logInfo('Let\'s configure your new project together. I\'ll guide you through each step.')
    
    try {
      // Se um diretório foi especificado, criar e navegar até ele
      if (targetDir) {
        CLIStyle.logInfo(`Creating project in directory: ${targetDir}`)
        
        // Normalizar o caminho do diretório
        const normalizedPath = normalizePath(targetDir)
        
        // Criar diretório se não existir
        if (!fs.existsSync(normalizedPath)) {
          fs.mkdirSync(normalizedPath, { recursive: true })
          CLIStyle.logSuccess(`Directory created: ${normalizedPath}`)
        }
        
        // Navegar para o diretório
        process.chdir(normalizedPath)
        CLIStyle.logSuccess(`Changed to directory: ${process.cwd()}`)
      }
      
      const spinner = CLIStyle.createSpinner('Checking required dependencies...')
      spinner.start()
      this.checkDependencies(DEPENDENCIES.required)
      spinner.succeed('All required dependencies are installed')

      const preferences = await this.gatherUserPreferences()
      await this.setupProject(preferences)
    } catch (error) {
      CLIStyle.logError('Project initialization failed', error)
      process.exit(1)
    }
  }

  private async gatherUserPreferences() {
    CLIStyle.startSequence('Project Configuration')
    
    const isNextProject = isNextJSProject()
    
    const packageManager = await inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Which package manager do you prefer?',
      choices: [
        { name: 'bun', value: 'bun' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' }
      ],
      default: 'npm'
    })

    let projectType = { value: 'nextjs' }
    if (!isNextProject) {
      projectType = await inquirer.prompt({
        type: 'list',
        name: 'value',
        message: 'What type of project are you creating?',
        choices: [
          {
            name: 'Fullstack (Igniter.js, Next.js, Zod and Prisma)',
            value: 'nextjs',
          },
          {
            name: 'Rest API (Igniter.js, Express, Zod and Prisma)',
            value: 'express',
          },
          {
            name: 'Only setup Igniter.js',
            value: 'igniter',
          }
        ]
      })
    }

    const database = await inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Would you like to set up Prisma ORM?',
      choices: [
        { 
          name: 'Yes, set up Prisma',
          value: 'prisma',
        },
        { 
          name: 'No, skip database setup',
          value: 'none',
        }
      ],
      default: 'prisma'
    })
    
    // Display confirmation of selections
    console.log('\n')
    CLIStyle.logInfo('Configuration summary:')
    CLIStyle.logInfo(`Package Manager: ${packageManager.value}`)
    if (!isNextProject) CLIStyle.logInfo(`Project Type: ${projectType.value}`)
    CLIStyle.logInfo(`Database: ${database.value === 'prisma' ? 'Prisma ORM' : 'None'}`)
    
    if (database.value === 'prisma') {
      console.log('\n')
      CLIStyle.logInfo(`Note: With Prisma enabled, you can use the igniter generate feature command to automatically create features based on your Prisma schema models.`)
    }
    
    const confirm = await inquirer.prompt({
      type: 'confirm',
      name: 'value',
      message: 'Ready to proceed with the installation?',
      default: true
    })
    
    if (!confirm.value) {
      CLIStyle.logWarning('Installation cancelled by the user')
      process.exit(0)
    }
    
    CLIStyle.endSequence()
    return {
      'package-manager': packageManager.value,
      'project-type': projectType.value,
      'database': database.value,
    }
  }

  private async generateFeature(name: string, fields: string[] = [], autoConfirm: boolean = false) {
    console.clear()
    CLIStyle.startSequence(`Generating Feature: ${name}`)

    try {
      // Check if model exists in Prisma
      const spinner = CLIStyle.createSpinner('Parsing Prisma schema...')
      spinner.start()
      
      const modelExists = this.schemaParser.hasModel(name)
      
      if (!modelExists) {
        spinner.warn(`Model "${name}" not found in Prisma schema`)
        
        // Ask user if they want to create a feature without a model
        let createFeature = autoConfirm
        
        if (!autoConfirm) {
          CLIStyle.logInfo("The model doesn't exist in your Prisma schema")
          console.log(CLIStyle.getVerticalLine())
          
          const answer = await inquirer.prompt({
            type: 'confirm',
            name: 'createFeature',
            message: CLIStyle.logPrompt(`Would you like to create a basic feature for "${name}" anyway?`),
            default: true
          })
          
          createFeature = answer.createFeature
        }
        
        if (!createFeature) {
          CLIStyle.logWarning('Feature generation cancelled')
          CLIStyle.endSequence()
          return
        }
        
        CLIStyle.logInfo(`Creating basic feature for "${name}" without database model`)
      }
      
      // Parse fields from Prisma schema
      let parsedFields: any[] = []
      if (modelExists) {
        parsedFields = this.schemaParser.getModelFields(name)
        
        // Transform parsed fields to include relationship info
        parsedFields = parsedFields.map(field => ({
          ...field,
          isRelation: !!field.relations,
          isList: field.isList || (field.relations?.type === 'one-to-many' || field.relations?.type === 'many-to-many'),
          isOptional: field.hasDefault || field.isOptional
        }))
      } else if (fields.length > 0) {
        // Use provided fields as fallback
        parsedFields = fields.map(field => {
          const [name, type] = field.split(':')
          return {
            name,
            type: type || 'String',
            zodType: 'z.string()',
            description: `${name} field`,
            isOptional: false,
            isList: false,
            hasDefault: false,
            isRelation: false,
            relations: undefined
          }
        })
      }

      spinner.succeed('Schema analysis completed')

      // Create feature directory
      CLIStyle.startStep('Creating directory structure')
      const featurePath = path.join('src/features', name.toLowerCase())
      this.createDir(featurePath)

      // Create presentation directory and its subdirectories
      const presentationPath = path.join(featurePath, 'presentation')
      this.createDir(presentationPath)

      const presentationDirs = [
        'components',
        'hooks',
        'contexts',
        'utils'
      ]

      for (const dir of presentationDirs) {
        const dirPath = path.join(presentationPath, dir)
        this.createDir(dirPath)
        this.createFile(path.join(dirPath, '.gitkeep'), '')
      }

      // Create feature subdirectories
      const featureDirs = [
        'controllers',
        'procedures',
      ]

      for (const dir of featureDirs) {
        this.createDir(path.join(featurePath, dir))
      }
      CLIStyle.endStep()

      // Generate files from templates
      CLIStyle.startStep('Generating feature files')
      const templateData = {
        name,
        fields: parsedFields,
        hasFields: parsedFields.length > 0,
        noModel: !modelExists
      }

      const templates = {
        'feature.index': 'index.ts',
        'feature.interface': `${name.toLowerCase()}.interface.ts`,
        'feature.controller': `controllers/${name.toLowerCase()}.controller.ts`,
        'feature.procedure': `procedures/${name.toLowerCase()}.procedure.ts`
      }

      for (const [template, filePath] of Object.entries(templates)) {
        const content = TemplateHandler.render(template, templateData)
        this.createFile(path.join(featurePath, filePath), content)
      }
      CLIStyle.endStep()

      CLIStyle.endSequence()
      CLIStyle.logSuccess(`Feature ${name} generated successfully!`)
      
      if (modelExists && parsedFields.length > 0) {
        CLIStyle.logInfo(`Created ${Object.keys(templates).length} files with ${parsedFields.length} fields from Prisma model`)
      } else if (!modelExists && parsedFields.length > 0) {
        CLIStyle.logInfo(`Created ${Object.keys(templates).length} files with ${parsedFields.length} custom fields`)
      } else if (!modelExists) {
        CLIStyle.logInfo(`Created basic feature template without fields`)
      } else {
        CLIStyle.logWarning(`No fields were found in the Prisma schema for model ${name}`)
      }
      console.log('\n')
    } catch (error) {
      CLIStyle.logError('Feature generation failed', error)
      process.exit(1)
    }
  }

  private async generateAllFeatures() {
    console.clear()
    CLIStyle.startSequence('Batch Feature Generation')

    try {
      // Get all models from schema
      const schemaContent = this.schemaParser.getSchemaContent()
      const modelRegex = /model\s+(\w+)\s*{/g
      let match
      const models: string[] = []

      while ((match = modelRegex.exec(schemaContent)) !== null) {
        models.push(match[1])
      }

      if (models.length === 0) {
        CLIStyle.logWarning('No models found in your Prisma schema')
        CLIStyle.logInfo('Tip: Add some models to your schema.prisma file first')
        CLIStyle.endSequence()
        return
      }

      // Let user select models
      const { selectedModels } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedModels',
        message: CLIStyle.logPrompt('Select which models to generate features for:'),
        choices: models.map(model => ({
          name: model,
          value: model,
          checked: false
        }))
      }])

      if (selectedModels.length === 0) {
        CLIStyle.logWarning('No models selected. Operation cancelled.')
        CLIStyle.endSequence()
        return
      }

      CLIStyle.startStep(`Generating ${selectedModels.length} features`)
      
      // Track progress
      let completed = 0
      const total = selectedModels.length
      const failed: string[] = []

      for (const model of selectedModels) {
        const spinner = CLIStyle.createSpinner(`Processing model ${model} [${completed + 1}/${total}]`)
        spinner.start()

        try {
          // Create a feature without displaying all the normal output
          const featurePath = path.join('src/features', model.toLowerCase())
          this.createDir(featurePath)
          
          // Create subdirectories
          const presentationPath = path.join(featurePath, 'presentation')
          this.createDir(presentationPath)
          
          for (const dir of ['components', 'hooks', 'contexts', 'utils']) {
            const dirPath = path.join(presentationPath, dir)
            this.createDir(dirPath)
            this.createFile(path.join(dirPath, '.gitkeep'), '')
          }
          
          for (const dir of ['controllers', 'procedures']) {
            this.createDir(path.join(featurePath, dir))
          }
          
          // Parse fields and generate templates
          let parsedFields = this.schemaParser.getModelFields(model)
          parsedFields = parsedFields.map(field => ({
            ...field,
            isRelation: !!field.relations,
            isList: field.isList || (field.relations?.type === 'one-to-many' || field.relations?.type === 'many-to-many'),
            isOptional: field.hasDefault || field.isOptional
          }))
          
          const templateData = { name: model, fields: parsedFields }
          const templates = {
            'feature.index': 'index.ts',
            'feature.interface': `${model.toLowerCase()}.interface.ts`,
            'feature.controller': `controllers/${model.toLowerCase()}.controller.ts`,
            'feature.procedure': `procedures/${model.toLowerCase()}.procedure.ts`
          }
          
          for (const [template, filePath] of Object.entries(templates)) {
            const content = TemplateHandler.render(template, templateData)
            this.createFile(path.join(featurePath, filePath), content)
          }
          
          completed++
          spinner.succeed(`Generated feature for ${model}`)
        } catch (error) {
          failed.push(model)
          spinner.fail(`Failed to generate feature for ${model}`)
          CLIStyle.logInfo(`Error: ${error}`)
        }

        // Show progress
        const progress = completed / total * 100
        CLIStyle.logInfo(`Progress: ${Math.round(progress)}% [${'='.repeat(Math.floor(progress / 5))}${' '.repeat(20 - Math.floor(progress / 5))}]`)
      }
      
      CLIStyle.endStep()
      CLIStyle.endSequence()

      // Final summary
      CLIStyle.logInfo(`Generation summary:`)
      CLIStyle.logSuccess(`Successfully generated: ${completed}/${total} features`)

      if (failed.length > 0) {
        CLIStyle.logWarning(`Failed to generate: ${failed.length} features`)
        CLIStyle.logInfo('Failed models:')
        failed.forEach(model => CLIStyle.logInfo(`- ${model}`))
      }

    } catch (error) {
      CLIStyle.logError('Failed to generate features', error)
      process.exit(1)
    }
  }

  protected async setupProject(preferences: any): Promise<void> {
    CLIStyle.startSequence('Project Setup')
    CLIStyle.logInfo('Setting up your Igniter project. This might take a few minutes...')

    // Project structure
    CLIStyle.startStep('Setting up project structure')
    const spinner2 = CLIStyle.createSpinner('Creating directories...')
    spinner2.start()    

    const packageManager = preferences['package-manager']

    const isNextProject = isNextJSProject()
    if (isNextProject) {
      this.createDir('src/app/api/[[...all]]')
      this.createFile('src/app/api/[[...all]]/route.ts', TemplateHandler.render('route.hbs', {}))
      this.createFile('src/hooks/use-form-with-zod.ts', TemplateHandler.render('use-form-with-zod', {}))
    }

    if(!isNextProject) {
      if (preferences['project-type'] === 'express') {
        this.execCommand(`${packageManager} init -y`)
        this.execCommand(`${packageManager} install express`)
        this.execCommand(`${packageManager} install --save-dev typescript ts-node @types/node @types/express`)

        const packageJson = this.loadJSON('package.json')
    
        packageJson.name = path.basename(process.cwd())
        packageJson.version = '1.0.0'
        packageJson.legacyPeerDeps = true
        packageJson.scripts = {}
        packageJson.scripts['build'] = 'tsc'
        packageJson.scripts['start'] = 'node dist/server.js'
        packageJson.scripts['dev'] = 'ts-node src/server.ts'

        this.saveJSON('package.json', packageJson)        
        
        this.createFile('src/server.ts', TemplateHandler.render('express.server.hbs', {}))

        this.createFile('README.md', TemplateHandler.render('readme.hbs', {}))
        this.createFile('eslintrc.json', TemplateHandler.render('eslintrc.hbs', {}))
        this.createFile('docker-compose.yml', TemplateHandler.render('docker-compose.hbs', {}))
      }

      if (preferences['project-type'] === 'nextjs') {
        this.execCommand(`npx create-next-app@latest --ts --tailwind --eslint	--app	--src-dir	--turbopack	--import-alias="@/*" --use-${packageManager} .`)

        const packageJson = this.loadJSON('package.json')
    
        packageJson.name = path.basename(process.cwd())
        packageJson.version = '1.0.0'
        packageJson.legacyPeerDeps = true

        this.saveJSON('package.json', packageJson)
        
        this.createFile('.github/copilot.next.instructions.md', TemplateHandler.render('copilot.next.instructions.hbs', {}))
        this.createFile('.github/copilot.form.instructions.md', TemplateHandler.render('copilot.form.instructions.hbs', {}))

        this.createFile('src/app/page.tsx', TemplateHandler.render('page.hbs', {}))
        this.createFile('src/app/layout.tsx', TemplateHandler.render('layout.hbs', {}))
        this.createFile('src/app/globals.css', TemplateHandler.render('globals.hbs', {}))

        this.createDir('src/app/api/[[...all]]')
        this.createFile('src/app/api/[[...all]]/route.ts', TemplateHandler.render('route.hbs', {}))

        this.createFile('src/hooks/use-form-with-zod.ts', TemplateHandler.render('use-form-with-zod', {}))

        this.createFile('README.md', TemplateHandler.render('readme.hbs', {}))
        this.createFile('eslintrc.json', TemplateHandler.render('eslintrc.hbs', {}))
        this.createFile('docker-compose.yml', TemplateHandler.render('docker-compose.hbs', {}))

        const runner = getPackageManagerRunner(packageManager)
        if(!runner) {
          CLIStyle.logError('Unsupported package manager. Please use npm, yarn, pnpm or bun.')
          process.exit(1)
        }
        
        console.log(runner)

        this.execCommand(`${runner} shadcn@latest init -y -f --src-dir --css-variables --base-color zinc`)
        this.execCommand(`${runner} shadcn@latest add -y -a`)
      }
    }
    
    this.createDirectoryStructure(PROJECT_STRUCTURE)

    spinner2.succeed('Directory structure created')
    CLIStyle.endStep()

    // Prisma setup (conditional)
    if (preferences.database === 'prisma') {
      CLIStyle.startStep('Setting up Prisma ORM')
      const spinner3 = CLIStyle.createSpinner('Initializing Prisma...')
      spinner3.start()
      this.execCommand('npx prisma init')
      this.execCommand('rm ./.env')
      const prismaFile = TemplateHandler.render('prisma', {})
      this.createFile('src/providers/prisma.ts', prismaFile)
      spinner3.succeed('Prisma initialized')
      CLIStyle.endStep()
    } else {
      CLIStyle.logInfo('Skipping Prisma setup as per your preference')
    }

    // Core dependencies
    CLIStyle.startStep('Installing Igniter.js and updating environment files')
    const spinner5 = CLIStyle.createSpinner('Installing packages...')
    spinner5.start()
    this.execCommand(`${packageManager} install @igniter-js/eslint-config`)
    this.execCommand(`${packageManager} install @igniter-js/core`)

    const envContent = TemplateHandler.render('env.hbs', {})
    this.createFile('.env', envContent)

    this.createFile('src/igniter.client.ts', TemplateHandler.render('igniter.client', {}))
    this.createFile('src/igniter.context.ts', TemplateHandler.render('igniter.context', {}))
    this.createFile('src/igniter.router.ts', TemplateHandler.render('igniter.router', {}))
    this.createFile('src/igniter.ts', TemplateHandler.render('igniter', {}))

    spinner5.succeed('Igniter.js installed and environment files updated')
    CLIStyle.endStep()

    // Lia files
    CLIStyle.startStep('Creating Lia assistant files for GitHub Copilot')
    const spinner10 = CLIStyle.createSpinner('Setting up Lia...')
    spinner10.start()
    
    for (const file of LIA_FILES) {
      const content = TemplateHandler.render(file.template, {})
      this.createFile(file.name, content)
    }

    spinner10.succeed('Lia assistant configured')
    CLIStyle.endStep()

    CLIStyle.endSequence()
    CLIStyle.logSuccess('Your Igniter project is ready!')

    console.log('\n' + '🎯 Next Steps:\n')
    console.log(`  1. Start development server:`)
    console.log(`     $ npm run dev`)
    console.log('')
    
    if (preferences.database === 'prisma') {
      console.log(`  2. Start Docker services for database:`)
      console.log(`     $ docker compose up -d`)
      console.log('')
      
      console.log(`  3. Run Prisma migrations:`)
      console.log(`     $ npx prisma migrate dev`)
      console.log('')
      
      console.log(`  4. Generate features from your database models:`)
      console.log(`     $ npx @igniter-js/cli generate feature`)
      console.log('')
    }

    console.log('\n' + '🎯 Next Steps:\n')
    console.log(`  1. Start development server:`)
    console.log(`     $ npm run dev`)
    console.log('')
    
    if (preferences.database === 'prisma') {
      console.log(`  2. Start Docker services for database:`)
      console.log(`     $ docker compose up -d`)
      console.log('')
      
      console.log(`  3. Run Prisma migrations:`)
      console.log(`     $ npx prisma migrate dev`)
      console.log('')
      
      console.log(`  4. Generate features from your database models:`)
      console.log(`     $ npx @igniter-js/cli generate feature`)
      console.log('')
    }

    console.log(`  📚 Documentation: https://github.com/felipebarcelospro/igniter-js`)
    console.log(`  💡 Need help? https://github.com/felipebarcelospro/igniter-js/issues`)
    console.log('\n' + '✨ Happy coding with Igniter! ✨\n')
  }
}

// Start CLI
new IgniterCLI()