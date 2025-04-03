import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { INTERACTIVE_COMMANDS } from './consts'
import { isWindows, normalizePath } from './platform-utils'

export class CLIHelper {
  protected execCommand(command: string): void {
    try {
      // Ajustar comando para Windows se necessário
      const adjustedCommand = this.adjustCommandForWindows(command)
      
      const needsInteraction = INTERACTIVE_COMMANDS.some((cmd: string) => adjustedCommand.includes(cmd))
      
      if (needsInteraction) {
        console.log(`\n📦 Executing: ${adjustedCommand}\n`)
        execSync(adjustedCommand, { stdio: 'inherit' })
        console.log('\n✅ Command completed successfully\n')
      } else {
        execSync(adjustedCommand, { 
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        })
      }
    } catch (error) {
      console.error(`Failed to execute command: ${command} \n${error}`)
      process.exit(1)
    }
  }

  // Método para ajustar comandos para Windows
  private adjustCommandForWindows(command: string): string {
    if (!isWindows()) return command

    // Ajustes específicos para Windows
    let adjustedCommand = command;
    
    // Ajustar comandos npm/yarn/pnpm/bun no Windows que podem precisar do .cmd
    if (adjustedCommand.startsWith('npx ')) {
      adjustedCommand = adjustedCommand.replace(/^npx /, 'npx.cmd ')
    }
    
    // Ajustar comandos para gerenciadores de pacotes no Windows
    const packageManagerCommands = ['npm', 'yarn', 'pnpm', 'bun'];
    for (const pm of packageManagerCommands) {
      if (adjustedCommand.startsWith(`${pm} `)) {
        adjustedCommand = adjustedCommand.replace(new RegExp(`^${pm} `), `${pm}.cmd `)
      }
    }
    
    // Ajustar comandos que usam ferramentas externas
    if (adjustedCommand.includes('shadcn')) {
      adjustedCommand = adjustedCommand.replace(/shadcn@latest/g, 'shadcn.cmd@latest')
    }
    
    return adjustedCommand
  }

  protected createDir(dir: string): void {
    const normalizedDir = normalizePath(dir)
    if (!fs.existsSync(normalizedDir)) {
      fs.mkdirSync(normalizedDir, { recursive: true })
    }
  }

  protected createFile(filePath: string, content: string = ''): void {
    const normalizedPath = normalizePath(filePath)
    const dir = path.dirname(normalizedPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(normalizedPath, content)
  }

  protected updateFile(filePath: string, content: string): void {
    fs.writeFileSync(normalizePath(filePath), content)
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
      return JSON.parse(fs.readFileSync(normalizePath(filePath), 'utf8'))
    } catch (error) {
      console.error(`Failed to load JSON file: ${filePath} \n${error}`)
      process.exit(1)
    }
  }

  protected saveJSON(filePath: string, data: any): void {
    try {
      fs.writeFileSync(normalizePath(filePath), JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`Failed to save JSON file: ${filePath} \n${error}`)
      process.exit(1)
    }
  }

  protected createDirectoryStructure(structure: Record<string, any>, basePath: string = ''): void {
    Object.entries(structure).forEach(([dir, content]) => {
      const fullPath = normalizePath(path.join(basePath, dir))
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