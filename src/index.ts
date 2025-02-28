#!/usr/bin/env node
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'

import { Command } from 'commander'
import { CLIHelper } from './utils/helpers'
import { CONFIG_FILES, DEPENDENCIES, LIA_FILES, PROJECT_STRUCTURE } from './utils/consts'
import { TemplateHandler } from './utils/template-handler'
import { registerHelpers } from './utils/handlebars-helpers'
import { PrismaSchemaParser } from './utils/prisma-schema-parser'
import { AnalyzeCommand } from './utils/analyze'

class IgniterCLI extends CLIHelper {
  private program: Command
  private spinner: ora.Ora
  private schemaParser: PrismaSchemaParser
  private analyze: AnalyzeCommand

  constructor() {
    super()
    this.program = new Command()
    this.spinner = ora()
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
      .description('Initialize a new Next.js project with Igniter Framework')
      .action(async () => {
        await this.init()
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
      .option('-n, --name [name]', 'Feature name')
      .option('-f, --fields <fields...>', 'Fields for the feature (format: name:type)')
      .action(async (name, options) => {
        if (!options.name) {
          await this.generateAllFeatures()
          return
        }

        await this.generateFeature(name, options.fields || [])
      })

    this.program.parse()
  }

  private async init() {
    console.clear()
    console.log(chalk.bold.cyan('\n🚀 Welcome to Igniter Framework!\n'))
    console.log(chalk.gray('Let\'s set up your new project. This may take a few minutes...\n'))

    try {
      // Check dependencies
      this.spinner.start('Checking required dependencies...')
      this.checkDependencies(DEPENDENCIES.required)
      this.spinner.succeed()

      // Setup project
      await this.setupProject()
    } catch (error) {
      this.spinner.fail(chalk.red('Project initialization failed'))
      console.error('\n' + chalk.red('Error details:'))
      console.error(chalk.red(error))
      process.exit(1)
    }
  }
  
  private async generateFeature(name: string, fields: string[] = []) {
    console.clear()
    console.log(chalk.bold.cyan(`\n🏗️  Generating feature: ${chalk.white(name)}\n`))

    try {
      // Parse fields from Prisma schema
      this.spinner.start('Parsing Prisma schema...')
      let parsedFields = this.schemaParser.getModelFields(name)

      // If no fields found in schema, use provided fields as fallback
      if (parsedFields.length === 0 && fields.length > 0) {
        parsedFields = fields.map(field => {
          const [name, type] = field.split(':')
          return {
            name,
            type,
            zodType: 'z.string()',
            description: `${name} field`,
            isOptional: false,
            isList: false,
            hasDefault: false,
            isRelation: false,
            relations: undefined
          }
        })
      } else {
        // Transform parsed fields to include relationship info
        parsedFields = parsedFields.map(field => ({
          ...field,
          isRelation: !!field.relations,
          isList: field.isList || (field.relations?.type === 'one-to-many' || field.relations?.type === 'many-to-many'),
          isOptional: field.hasDefault || field.isOptional
        }))
      }

      this.spinner.succeed()

      // Create feature directory
      this.spinner.start('Creating feature directory structure...')
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

      this.spinner.succeed()

      // Generate files from templates
      const templateData = {
        name,
        fields: parsedFields
      }

      this.spinner.start('Generating feature files...')
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

      this.spinner.succeed()
      console.log('\n' + chalk.bold.green(`✨ Feature ${chalk.white(name)} generated successfully! ✨\n`))
    } catch (error) {
      this.spinner.fail(chalk.red('Feature generation failed'))
      console.error('\n' + chalk.red('Error details:'))
      console.error(chalk.red(error))
      process.exit(1)
    }
  }

  private async generateAllFeatures() {
    console.clear()
    console.log(chalk.bold.cyan('\n🏗️  Generating features for all Prisma models\n'))

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
        console.log('\n' + chalk.yellow('⚠️  No models found in your Prisma schema.'))
        console.log(chalk.gray('\nTip: Add some models to your schema.prisma file first.'))
        return
      }

      // Let user select models
      const { selectedModels } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedModels',
        message: chalk.yellow('\n🎯 Select which models to generate features for:'),
        choices: models.map(model => ({
          name: model,
          value: model,
          checked: false
        }))
      }])

      if (selectedModels.length === 0) {
        console.log(chalk.gray('\nNo models selected. Operation cancelled.'))
        return
      }

      // Track progress
      let completed = 0
      const total = selectedModels.length
      const failed: string[] = []

      for (const model of selectedModels) {
        this.spinner.start(chalk.white(`Generating feature for ${chalk.cyan(model)} [${completed + 1}/${total}]`))

        try {
          await this.generateFeature(model)
          completed++

          this.spinner.succeed(chalk.green(`✓ Generated feature for ${chalk.cyan(model)}`))
        } catch (error) {
          failed.push(model)
          this.spinner.fail(chalk.red(`✗ Failed to generate feature for ${chalk.cyan(model)}`))
          console.log(chalk.gray(`   Error: ${error}`))
        }

        // Show progress bar
        const progress = completed / total * 100
        console.log(chalk.gray(`   Progress: ${chalk.cyan(`${Math.round(progress)}%`)} [${'='.repeat(Math.floor(progress / 5))}${' '.repeat(20 - Math.floor(progress / 5))}]`))
        console.log('')
      }

      // Final summary
      console.log(chalk.bold.white('\n📊 Generation Summary:'))
      console.log(chalk.green(`   ✓ Successfully generated: ${completed}/${total} features`))

      if (failed.length > 0) {
        console.log(chalk.red(`   ✗ Failed to generate: ${failed.length} features`))
        console.log(chalk.gray('\nFailed models:'))
        failed.forEach(model => console.log(chalk.red(`   - ${model}`)))
      }

      if (completed === total) {
        console.log('\n' + chalk.bold.green('✨ All features generated successfully! ✨'))
      } else {
        console.log('\n' + chalk.yellow('⚠️  Some features could not be generated.'))
        console.log(chalk.gray('   Check the errors above and try again.'))
      }

      console.log('')

    } catch (error) {
      this.spinner.fail(chalk.red('❌ Failed to generate features'))
      console.error('\n' + chalk.red('Error details:'))
      console.error(chalk.gray(error))
      process.exit(1)
    }
  }

  protected async setupProject(): Promise<void> {
    console.log(chalk.cyan('\n📦 Project Setup Progress\n'))

    // Next.js setup
    this.spinner.start('Creating Next.js application...')
    await this.delay(1000) // Pequena pausa para melhor visualização
    this.execCommand('npx create-next-app@canary --ts --turbopack --import-alias "@/*" --src-dir --tailwind --eslint --typescript --app .')
    this.spinner.succeed('Next.js application created successfully')

    // Project structure
    await this.delay(1000)
    this.spinner.start('Creating project structure...')
    this.createDirectoryStructure(PROJECT_STRUCTURE)
    this.spinner.succeed('Project structure created successfully')

    // Prisma setup
    await this.delay(1000)
    this.spinner.start('Initializing Prisma...')
    this.execCommand('npx prisma init')
    this.execCommand('rm ./.env')
    const prismaFile = TemplateHandler.render('prisma', {})
    this.createFile('src/core/providers/prisma.ts', prismaFile)
    this.spinner.succeed('Prisma initialized successfully')

    // Testing environment
    await this.delay(1000)
    this.spinner.start('Setting up testing environment...')
    this.execCommand('npm install --save-dev vitest')
    this.execCommand('npm install --save-dev @vitejs/plugin-react')
    this.execCommand('npm install --save-dev vite-tsconfig-paths')
    this.spinner.succeed('Testing environment setup completed')

    // Core dependencies
    await this.delay(1000)
    this.spinner.start('Installing core dependencies...')
    this.execCommand('npm install --save @igniter-js/eslint-config')
    this.execCommand('npm install --save @igniter-js/core')
    this.spinner.succeed('Core dependencies installed successfully')

    // Shadcn/UI setup
    await this.delay(1000)
    this.spinner.start('Setting up Shadcn/UI...')
    this.execCommand('npm config set legacy-peer-deps true')
    this.execCommand('npx shadcn@canary init -d -y')
    const content = TemplateHandler.render('components.json', {})
    this.updateFile('components.json', content)
    this.execCommand('npx shadcn@canary add --all')
    this.spinner.succeed('Shadcn/UI setup completed')

    // Environment files
    await this.delay(1000)
    this.spinner.start('Creating environment files...')
    const envContent = TemplateHandler.render('env.hbs', {})
    this.createFile('.env', envContent)
    this.spinner.succeed('Environment files created successfully')

    // Project files configuration
    await this.delay(1000)
    this.spinner.start('Configuring project files...')
    this.execCommand('mv ./src/lib/utils.ts ./src/core/utils/cn.ts')
    this.execCommand('rm -rf ./src/lib')

    const pageContent = TemplateHandler.render('page.hbs', {})
    this.updateFile('src/app/page.tsx', pageContent)

    const layoutContent = TemplateHandler.render('layout.hbs', {})
    this.updateFile('src/app/layout.tsx', layoutContent)

    const globalsContent = TemplateHandler.render('globals.hbs', {})
    this.updateFile('src/app/globals.css', globalsContent)
    this.spinner.succeed('Project files configured successfully')

    // Package configuration
    await this.delay(1000)
    this.spinner.start('Updating package configuration...')
    const packageJson = this.loadJSON('package.json')
    for (const config of CONFIG_FILES) {
      const content = TemplateHandler.render(config.template, {})
      this.createFile(config.name, content)
    }
    this.spinner.succeed('Package configuration updated successfully')

    // Lia files
    await this.delay(1000)
    this.spinner.start('Creating Lia files...')
    for (const file of LIA_FILES) {
      const content = TemplateHandler.render(file.template, {})
      this.createFile(file.name, content)
    }
    this.spinner.succeed('Lia files created successfully')

    this.spinner.start('Creating igniter files...')

    const igniterClientFile = TemplateHandler.render('igniter.client', {})
    const igniterContextFile = TemplateHandler.render('igniter.context', {})
    const igniterRouterFile = TemplateHandler.render('igniter.router', {})    
    const igniterRouteHandlerFile = TemplateHandler.render('route', {})    
    const igniterFile = TemplateHandler.render('igniter', {})

    this.createFile('src/igniter.client.ts', igniterClientFile)
    this.createFile('src/igniter.context.ts', igniterContextFile)
    this.createFile('src/igniter.router.ts', igniterRouterFile)
    this.createFile('src/app/api/[[...all]]/route.ts', igniterRouteHandlerFile)
    this.createFile('src/igniter.ts', igniterFile)
    
    this.spinner.succeed('Igniter files created successfully')

    packageJson.name = path.basename(process.cwd())
    packageJson.version = '1.0.0'
    packageJson.legacyPeerDeps = true

    packageJson.scripts['igniter'] = 'npx @igniter-js/cli'

    this.saveJSON('package.json', packageJson)
    this.spinner.succeed('Package configuration updated successfully')

    console.log('\n' + chalk.bold.cyan('🎉 Setup Complete!\n'))
    console.log(chalk.bold('Next Steps:'))
    console.log(`
  ${chalk.cyan('1.')} Start development server:
     ${chalk.gray('$')} ${chalk.white('npm run dev')}

  ${chalk.cyan('2.')} Start Docker services:
     ${chalk.gray('$')} ${chalk.white('docker compose up -d')}

  ${chalk.cyan('3.')} Run Prisma migrations client:
     ${chalk.gray('$')} ${chalk.white('npx prisma migrate dev')}

  ${chalk.cyan('4.')} Create your first feature:
     ${chalk.gray('$')} ${chalk.white('npx @igniter-js/cli generate feature')}

  ${chalk.cyan('📚')} Documentation: ${chalk.blue('https://github.com/felipebarcelospro/igniter-js')}
  ${chalk.cyan('💡')} Need help? ${chalk.blue('https://github.com/felipebarcelospro/igniter-js/issues')}
    `)
    console.log(chalk.bold.green('\n✨ Happy coding! ✨\n'))
  }
}

// Start CLI
new IgniterCLI()