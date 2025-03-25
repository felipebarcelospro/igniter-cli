import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { INTERACTIVE_COMMANDS } from './consts'

export class CLIHelper {
  protected execCommand(command: string): void {
    try {
      const needsInteraction = INTERACTIVE_COMMANDS.some((cmd: string) => command.includes(cmd))
      
      if (needsInteraction) {
        console.log(`\n📦 Executing: ${command}\n`)
        execSync(command, { stdio: 'inherit' })
        console.log('\n✅ Command completed successfully\n')
      } else {
        execSync(command, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        })
      }
    } catch (error) {
      console.error(`Failed to execute command: ${command} \n${error}`)
      process.exit(1)
    }
  }

  protected createDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  protected createFile(filePath: string, content: string = ''): void {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content)
  }

  protected updateFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content)
  }

  protected checkDependencies(dependencies: string[]): void {
    for (const dep of dependencies) {
      try {
        execSync(`${dep} --version`, { stdio: 'pipe' })
      } catch (error) {
        console.error(
          `Required dependency not found: ${dep}. Please install it before proceeding. \n${error}`,
        )
        process.exit(1)
      }
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected loadJSON(filePath: string): any {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      console.error(`Failed to load JSON file: ${filePath} \n${error}`)
      process.exit(1)
    }
  }

  protected saveJSON(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Failed to save JSON file: ${filePath} \n${error}`)
      process.exit(1)
    }
  }

  protected createDirectoryStructure(structure: Record<string, any>, basePath: string = ''): void {
    Object.entries(structure).forEach(([dir, content]) => {
      const fullPath = path.join(basePath, dir)
      this.createDir(fullPath)

      if (Array.isArray(content)) {
        content.forEach(file => {
          if (typeof file === 'string') {
            this.createFile(path.join(fullPath, file))
          }
        })
      } else if (content && typeof content === 'object') {
        this.createDirectoryStructure(content, fullPath)
      }
    })
  }

  protected installDependencies(dependencies: Record<string, string>, dev: boolean = false): void {
    const deps = Object.entries(dependencies)
      .map(([name, version]) => `${name}@${version}`)
      .join(' ')

    this.execCommand(`npm install ${dev ? '-D ' : ''}${deps}`)
  }
}