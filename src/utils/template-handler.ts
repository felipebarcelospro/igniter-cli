import Handlebars from 'handlebars';
import { readFile, readFileSync } from 'fs';
import path from 'path';

export class TemplateHandler {
  private static templatesPath = path.join(__dirname, '..', 'templates');

  static render(templateName: string, data: any, customPath?: string): string {
    if(!templateName.endsWith('.hbs')) {
      templateName = `${templateName}.hbs`
    }

    if(customPath) {
      this.templatesPath = path.join(__dirname, '..', customPath)
    }

    const templatePath = path.join(this.templatesPath, templateName);
    const templateContent = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const result = template(data);

    // If template is for .env file, add an extra line before appending
    if (templateName === '.env' || templateName.endsWith('env')) {
      return '\n' + result;
    }

    return result;
  }

  static registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn);
  }
} 