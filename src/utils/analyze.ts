import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import { PrismaSchemaParser } from '../utils/prisma-schema-parser'
import { CLIHelper } from './helpers'
import ora from 'ora'

const execAsync = promisify(exec)

interface AnalyzeReport {
  schema: {
    models: number
    relations: number
    complexModels: string[]
  }
  features: {
    count: number
    unused: string[]
    incomplete: string[]
    complexity: Record<string, number>
  }
  dependencies: {
    unused: string[]
    outdated: string[]
    security: string[]
  }
  performance: {
    bundleSize: string
    apiEndpoints: number
    slowQueries: string[]
  }
}

export class AnalyzeCommand extends CLIHelper {
  private readonly schemaParser: PrismaSchemaParser
  private report: AnalyzeReport
  private spinner: ora.Ora

  constructor(basePath: string = process.cwd()) {
    super()
    this.schemaParser = new PrismaSchemaParser(basePath)
    this.report = this.initializeReport()
    this.spinner = ora()
  }

  private initializeReport(): AnalyzeReport {
    return {
      schema: { models: 0, relations: 0, complexModels: [] },
      features: { count: 0, unused: [], incomplete: [], complexity: {} },
      dependencies: { unused: [], outdated: [], security: [] },
      performance: { bundleSize: '0KB', apiEndpoints: 0, slowQueries: [] }
    }
  }

  public async analyze(): Promise<void> {
    console.clear()
    this.spinner.start('Analyzing project structure')
    
    try {
      await this.analyzeSchema()
      await this.analyzeFeatures()
      await this.analyzeDependencies()
      await this.analyzePerformance()
      
      this.spinner.succeed('Analysis completed')
      this.displayReport()
    } catch (error) {
      this.spinner.fail('Analysis failed')
      console.error(chalk.red(error))
      process.exit(1)
    }
  }

  private async analyzeSchema(): Promise<void> {
    this.spinner.start('Analyzing Prisma schema')
    
    const content = this.schemaParser.getSchemaContent()
    const modelMatches = content.match(/model\s+\w+\s*{[^}]*}/g) || []
    
    this.report.schema.models = modelMatches.length
    
    // Analyze relations and complex models
    for (const model of modelMatches) {
      const relations = (model.match(/@relation/g) || []).length
      this.report.schema.relations += relations
      
      const modelName = model.match(/model\s+(\w+)/)?.[1] || ''
      if (relations > 3) {
        this.report.schema.complexModels.push(modelName)
      }
    }
    
    this.spinner.succeed('Schema analysis completed')
  }

  private async analyzeFeatures(): Promise<void> {
    this.spinner.start('Analyzing features')
    
    const featuresPath = path.join(process.cwd(), 'src/features')
    if (!fs.existsSync(featuresPath)) {
      this.spinner.info('No features directory found')
      return
    }

    const features = fs.readdirSync(featuresPath)
    this.report.features.count = features.length

    for (const feature of features) {
      const featurePath = path.join(featuresPath, feature)
      const requiredDirs = ['controllers', 'services', 'repositories', 'schemas']
      
      if (!requiredDirs.every(dir => fs.existsSync(path.join(featurePath, dir)))) {
        this.report.features.incomplete.push(feature)
      }

      // Analyze complexity based on file count and size
      let complexity = 0
      const files = this.getAllFiles(featurePath)
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        complexity += content.split('\n').length
      }
      this.report.features.complexity[feature] = complexity
    }

    this.spinner.succeed('Features analysis completed')
  }

  private async analyzeDependencies(): Promise<void> {
    this.spinner.start('Analyzing dependencies')
    
    try {
      const { stdout: npmOutdated } = await execAsync('npm outdated --json')
      this.report.dependencies.outdated = Object.keys(JSON.parse(npmOutdated))
    } catch (error) {
      // npm outdated returns error if dependencies are outdated
      if (error instanceof Error && 'stdout' in error) {
        const stdout = (error as any).stdout
        this.report.dependencies.outdated = Object.keys(JSON.parse(stdout))
      }
    }

    this.spinner.succeed('Dependencies analysis completed')
  }

  private async analyzePerformance(): Promise<void> {
    this.spinner.start('Analyzing performance')
    
    // Analyze API endpoints
    const apiPath = path.join(process.cwd(), 'src/app/api')
    if (fs.existsSync(apiPath)) {
      this.report.performance.apiEndpoints = this.countApiEndpoints(apiPath)
    }

    // Calculate bundle size
    const buildPath = path.join(process.cwd(), '.next/static')
    if (fs.existsSync(buildPath)) {
      this.report.performance.bundleSize = this.calculateBundleSize(buildPath)
    }

    this.spinner.succeed('Performance analysis completed')
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...this.getAllFiles(fullPath))
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  private countApiEndpoints(dir: string): number {
    const files = this.getAllFiles(dir)
    return files.filter(file => file.endsWith('route.ts')).length
  }

  private calculateBundleSize(dir: string): string {
    let totalSize = 0
    const files = this.getAllFiles(dir)
    
    for (const file of files) {
      const stats = fs.statSync(file)
      totalSize += stats.size
    }

    return `${Math.round(totalSize / 1024)}KB`
  }

  private displayReport(): void {
    this.spinner.start('Generating analysis report')
    
    const report = [
      // Schema Section
      chalk.cyan.bold('Schema Analysis'),
      chalk.gray(`├─ Models: ${this.report.schema.models}`),
      chalk.gray(`├─ Relations: ${this.report.schema.relations}`),
      this.report.schema.complexModels.length > 0 
        ? chalk.gray(`└─ Complex Models: ${this.report.schema.complexModels.join(', ')}`)
        : chalk.gray('└─ No complex models found'),

      '', // Empty line for spacing

      // Features Section
      chalk.cyan.bold('Features Analysis'),
      chalk.gray(`├─ Total Features: ${this.report.features.count}`),
      this.report.features.incomplete.length > 0
        ? chalk.gray(`└─ Incomplete Features: ${this.report.features.incomplete.join(', ')}`)
        : chalk.gray('└─ All features are complete'),

      '', // Empty line for spacing

      // Dependencies Section
      chalk.cyan.bold('Dependencies Analysis'),
      this.report.dependencies.outdated.length > 0
        ? chalk.gray(`└─ Outdated: ${this.report.dependencies.outdated.join(', ')}`)
        : chalk.gray('└─ All dependencies are up to date'),

      '', // Empty line for spacing

      // Performance Section
      chalk.cyan.bold('Performance Analysis'),
      chalk.gray(`├─ API Endpoints: ${this.report.performance.apiEndpoints}`),
      chalk.gray(`└─ Bundle Size: ${this.report.performance.bundleSize}`)
    ].join('\n')

    this.spinner.succeed('Analysis report generated')
    
    // Display the report
    console.log('\n' + report + '\n')

    // Show recommendations if needed
    if (this.report.schema.complexModels.length > 0 || 
        this.report.features.incomplete.length > 0 || 
        this.report.dependencies.outdated.length > 0) {
      this.spinner.info(chalk.yellow('Recommendations found. Run `igniter analyze --fix` for detailed suggestions.'))
    }
  }
}
