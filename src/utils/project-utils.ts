import fs from 'fs'
import path from 'path'

/**
 * Verifica se o projeto atual é um projeto Next.js
 * @returns {boolean} true se for um projeto Next.js, false caso contrário
 */
export function isNextJSProject(projectPath: string = process.cwd()): boolean {
  try {
    // Verifica se existe um package.json
    const packageJsonPath = path.join(projectPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return false

    // Lê o package.json e verifica se há dependência do Next.js
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    // Verifica nas dependencies e devDependencies
    const hasDependency = packageJson.dependencies?.next !== undefined
    const hasDevDependency = packageJson.devDependencies?.next !== undefined

    if (hasDependency || hasDevDependency) return true

    // Verificações adicionais de estrutura Next.js
    const possibleNextFiles = [
      'next.config.js',
      'next.config.mjs',
      'next.config.ts',
      path.join('src', 'app', 'layout.tsx'),
      path.join('app', 'layout.tsx')
    ]

    return possibleNextFiles.some(file => fs.existsSync(path.join(projectPath, file)))
  } catch (error) {
    console.error('Erro ao verificar se é um projeto Next.js:', error)
    return false
  }
}

/**
 * Verifica se o projeto possui uma pasta src
 * @returns {boolean} true se a pasta src existir, false caso contrário
 */
export function hasSrcFolder(projectPath: string = process.cwd()): boolean {
  try {
    const srcPath = path.join(projectPath, 'src')
    return fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()
  } catch (error) {
    console.error('Erro ao verificar a pasta src:', error)
    return false
  }
}

/**
 * Retorna o caminho base para o código da aplicação (src/ ou raiz)
 * @returns {string} O caminho base do código
 */
export function getProjectBasePath(projectPath: string = process.cwd()): string {
  return hasSrcFolder(projectPath) ? path.join(projectPath, 'src') : projectPath
}

/**
 * Retorna o caminho correto para a API do Next.js (com ou sem pasta src)
 * @returns {string} O caminho para a pasta de API
 */
export function getNextApiPath(projectPath: string = process.cwd()): string {
  const basePath = getProjectBasePath(projectPath)
  return path.join(basePath, 'app', 'api')
}

/**
 * Supported package managers
 */
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno'

/**
 * Detects the package manager used in the project
 * Priority: packageManager field in package.json > lock files presence
 * @param projectPath Path to the project root
 * @returns The detected package manager or 'npm' as fallback
 */
export function getPackageManager(projectPath: string = process.cwd()): PackageManager {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json')

    // Check package.json packageManager field first
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.packageManager) {
        const pm = packageJson.packageManager.split('@')[0]
        if (pm === 'npm' || pm === 'yarn' || pm === 'pnpm' || pm === 'bun') {
          return pm as PackageManager
        }
      }
    }

    // Check for lock files
    const lockFiles = {
      'bun.lockb': 'bun',
      'yarn.lock': 'yarn',
      'pnpm-lock.yaml': 'pnpm',
      'package-lock.json': 'npm',
      'deno.lock': 'deno'
    } as const

    for (const [lockFile, manager] of Object.entries(lockFiles)) {
      if (fs.existsSync(path.join(projectPath, lockFile))) {
        return manager as PackageManager
      }
    }

    // Fallback to npm if no lock file is found
    return 'npm'
  } catch (error) {
    console.error('Error detecting package manager:', error)
    return 'npm'
  }
}

export function getPackageManagerRunner(packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm'): string {
  // Check if the package manager is supported
  const runners = {
    npm: 'npx',
    yarn: 'yarn',
    pnpm: 'pnpx',
    bun: 'bunx'
  }

  return runners[packageManager]
}