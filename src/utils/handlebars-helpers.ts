import Handlebars from 'handlebars'

export function registerHelpers() {
  Handlebars.registerHelper('camelCase', (str: string) => {
    return str.replace(/[-_]([a-z])/g, (g: string) => g[1].toUpperCase())
  })

  Handlebars.registerHelper('pascalCase', (str: string) => {
    const camelCase = str.replace(/[-_]([a-z])/g, (g: string) => g[1].toUpperCase())
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
  })

  Handlebars.registerHelper('kebabCase', (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  })

  Handlebars.registerHelper('snakeCase', (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase()
  })

  Handlebars.registerHelper('lowerFirstLetter', (str: string) => {
    return str.charAt(0).toLowerCase() + str.slice(1)
  })

  Handlebars.registerHelper('lowerCase', (str: string) => {
    return str.toLowerCase()
  })

  /**
   * Handlebars helper to compare if two values are equal
   * @param {string} firstValue - First value to compare
   * @param {string} secondValue - Second value to compare
   * @returns {boolean} Returns true if values are equal, false otherwise
   */
  Handlebars.registerHelper('equals', (firstValue: string, secondValue: string): boolean => {
    return firstValue === secondValue
  })
}
