import chalk from 'chalk';
import ora, { Ora } from 'ora';
import os from 'os';
import path from 'path';

import { isWindows, getVisualElements } from './platform-utils';

const projectDir = path.resolve(__dirname, '..', '..');

export class CLIStyle {
  private static username = os.userInfo().username;
  private static visualElements = getVisualElements();
  private static currentSpinner: Ora | null = null;

  private static symbols = {
    info: this.visualElements.info || (isWindows() ? 'i' : '•'),
    success: this.visualElements.checkmark || (isWindows() ? '√' : '✓'),
    error: this.visualElements.cross_mark || (isWindows() ? 'x' : '✗'),
    warning: this.visualElements.warning || (isWindows() ? '!' : '⚠'),
    pending: this.visualElements.bullet || (isWindows() ? 'o' : '◦'),
    arrow: this.visualElements.arrow || (isWindows() ? '->' : '→'),
    verticalLine: this.visualElements.verticalLine || (isWindows() ? '|' : '│'),
    topLeft: this.visualElements.topLeft || (isWindows() ? '+' : '┌'),
    bottomLeft: this.visualElements.bottomLeft || (isWindows() ? '+' : '└')
  };

  static getVerticalLine() {
    return chalk.green(this.symbols.verticalLine);
  }

  static createSpinner(text: string): Ora {
    this.currentSpinner?.stop();
    this.currentSpinner = ora({
      text: `${text}`,
      spinner: {
        interval: 80,
        frames: isWindows() ? 
          ['|', '/', '-', '\\'] : 
          ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      },
      color: 'cyan',
      prefixText: this.getVerticalLine()
    });
    return this.currentSpinner;
  }

  static startSequence(title: string) {
    console.log('');
    console.log(`${chalk.yellow(this.symbols.arrow)} ${chalk.bold(title)}`);
    console.log(this.getVerticalLine());
  }

  static endSequence() {
    console.log(`${this.getVerticalLine()} ${chalk.green('✨')} ${chalk.dim('Completed')}`);
    console.log('');
  }

  static startStep(stepName: string) {
    console.log(this.getVerticalLine());
    console.log(`${this.getVerticalLine()} ${chalk.cyan(this.symbols.topLeft)}${chalk.cyan('─')} ${chalk.bold(stepName)}`);
  }

  static endStep() {
    console.log(`${this.getVerticalLine()} ${chalk.cyan(this.symbols.bottomLeft)}${chalk.cyan('─')} ${chalk.green(this.symbols.success)} ${chalk.dim('Done')}`);
  }

  static logSuccess(message: string) {
    console.log(this.getVerticalLine());
    console.log(`${this.getVerticalLine()} ${chalk.green(this.symbols.success)} ${message}`);
    console.log(this.getVerticalLine());
  }

  static logInfo(message: string) {
    console.log(`${this.getVerticalLine()} ${chalk.blue(this.symbols.info)} ${message}`);
  }

  static logError(message: string, error?: any) {
    console.log(`${this.getVerticalLine()} ${chalk.red(this.symbols.error)} ${message}`);
    if (error && process.env.DEBUG) {
      console.log(`${this.getVerticalLine()} ${chalk.dim(error.stack || error)}`);
    }
  }

  static logWarning(message: string) {
    console.log(`${this.getVerticalLine()} ${chalk.yellow(this.symbols.warning)} ${message}`);
  }

  static logPrompt(message: string) {
    console.log(this.getVerticalLine());
    console.log(`${this.getVerticalLine()} ${chalk.cyan('?')} ${message}`);
    return this.getVerticalLine();
  }

  // Get the system username
  static getUsername() {
    return this.username;
  }

  // Get the appropriate visual elements for the current platform
  static getVisualElements() {
    return this.visualElements;
  }

  // Styling for CLI header
  static formatHeader(branch = 'main') {
    const branchColor = branch === 'beta' ? chalk.red(branch) : chalk.blue(branch);
    // Get the directory name in a cross-platform way
    const currentDir = path.basename(projectDir);
    
    // Use a more compatible character for Windows
    const branchSymbol = isWindows() ? 'Ø' : 'ᛒ';
    
    return `${chalk.yellow(this.username)} in ${chalk.cyan(currentDir)} on ${chalk.magenta(branchSymbol)} ${branchColor}`;
  }

  // Display a selected option message
  static logOption(message: string, selected: boolean = false) {
    // Use appropriate symbols based on terminal capabilities
    const prefix = selected 
      ? chalk.green(isWindows() ? '*' : '●') 
      : chalk.gray(isWindows() ? 'o' : '○');
    console.log(`${this.getVerticalLine()} ${prefix} ${message}`);
  }

  // Formata o cabeçalho completo com tempo decorrido
  static formatFullHeader(branch = 'main', startTime = null) {
    const header = this.formatHeader(branch);
    
    if (startTime) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const timeStr = this.formatElapsedTime(elapsedSeconds);
      return `${header} ${chalk.gray('⏱')} ${chalk.white(timeStr)}`;
    }
    
    return header;
  }

  // Exibe o tempo decorrido
  static formatElapsedTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${remainingSeconds}s`;
    
    return result;
  }

  // Funções adicionais para o modo de desenvolvimento

  /**
   * Inicia uma sequência de inicialização do modo de desenvolvimento
   * @param {string} projectName - Nome do projeto
   */
  static startDevSequence(projectName: string) {
    console.log('');
    console.log(`${chalk.yellow(this.symbols.arrow)} ${chalk.bold(`Starting development server for ${chalk.cyan(projectName)}`)}`);
    console.log(this.getVerticalLine());
  }

  /**
   * Exibe uma mensagem de serviço iniciado no modo de desenvolvimento
   * @param {string} serviceName - Nome do serviço
   * @param {string} url - URL do serviço (opcional)
   */
  static logServiceStarted(serviceName: string, url: string | null = null) {
    if (url) {
      console.log(`${this.getVerticalLine()} ${chalk.green('▶')} ${chalk.bold(serviceName)}: ${chalk.blue(url)}`);
    } else {
      console.log(`${this.getVerticalLine()} ${chalk.green('▶')} ${chalk.bold(serviceName)} started`);
    }
  }
  /**
   * Exibe uma mensagem de serviço com status
   * @param {string} serviceName - Nome do serviço
   * @param {string} status - Status do serviço (running, stopped, error)
   */
  static logServiceStatus(serviceName: string, status: string) {
    const statusColors = {
      running: chalk.green('●'),
      stopped: chalk.yellow('○'),
      error: chalk.red('✖')
    };
    
    const statusIcon = statusColors[status as keyof typeof statusColors] || chalk.gray('?');
    console.log(`${this.getVerticalLine()} ${statusIcon} ${chalk.bold(serviceName)}: ${status}`);
  }
}
