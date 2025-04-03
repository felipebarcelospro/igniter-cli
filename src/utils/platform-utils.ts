import os from 'os'
import path from 'path'
import isWin from 'is-windows'

/**
 * Funções básicas de utilidade para detecção de plataforma
 * Arquivo separado para evitar referências circulares
 */

/**
 * Verifica se está rodando no Windows
 * @returns {boolean} True se estiver rodando no Windows
 */
export function isWindows() {
  return isWin() || process.platform === 'win32'
}

/**
 * Normaliza separadores de caminho para a plataforma atual
 * @param {string} filePath - O caminho a ser normalizado
 * @returns {string} O caminho normalizado
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath)
}

/**
 * Verifica se o terminal suporta caracteres Unicode
 * @returns {boolean} True se o terminal suportar caracteres Unicode
 */
export function supportsUnicode() {
  // Verificação mais robusta de suporte a Unicode no Windows
  const isWinOS = isWindows()
  
  // No Windows, verificar também a variável de ambiente TERM
  const termVar = process.env.TERM || ''
  const isPowerShell = process.env.SHELL?.includes('powershell') || false
  const isWindowsTerminal = process.env.WT_SESSION !== undefined
  
  // Windows Terminal e PowerShell Core suportam Unicode bem
  if (isWinOS && (isWindowsTerminal || isPowerShell || termVar.includes('xterm'))) {
    return true
  }
  
  // Para outros sistemas, verificar se é um TTY
  return process.stdout.isTTY && !isWinOS
}

/**
 * Obtém elementos visuais apropriados para a plataforma atual
 * @returns {object} Objeto contendo elementos visuais adequados para a plataforma atual
 */
export function getVisualElements() {
  const hasUnicodeSupport = supportsUnicode()
  
  // Elementos ASCII simples para baixa compatibilidade
  let elements = {
    verticalLine: '|',
    horizontalLine: '-',
    topRight: '+',
    topLeft: '+',
    bottomRight: '+',
    bottomLeft: '+',
    cross: '+',
    bullet: '*',
    checkmark: '√',
    cross_mark: 'x',
    warning: '!',
    info: 'i',
    arrow: '->'
  }
  
  // Elementos aprimorados para terminais com melhor suporte a símbolos
  if (hasUnicodeSupport) {
    elements = {
      verticalLine: '│',
      horizontalLine: '─',
      topRight: '┐',
      topLeft: '┌',
      bottomRight: '┘',
      bottomLeft: '└',
      cross: '┼',
      bullet: '•',
      checkmark: '✓',
      cross_mark: '✗',
      warning: '⚠',
      info: 'ℹ',
      arrow: '→'
    }
  }
  
  return elements
}

export default {
  isWindows,
  normalizePath,
  supportsUnicode,
  getVisualElements
}
