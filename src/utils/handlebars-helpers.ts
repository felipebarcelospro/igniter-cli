import Handlebars from 'handlebars'

export function registerHelpers() {
  Handlebars.registerHelper('camelCase', (str: string) => {
    if (!str) return ''
    
    const result = str
      .toLowerCase()
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .trim()

    return result
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

  Handlebars.registerHelper('getTypeFormat', (type: string, isRelation: boolean, isEnum?: boolean) => {
    const primitiveTypes = ['string', 'number', 'boolean', 'date', 'datetime', 'any', 'bigint', 'undefined', 'null', 'never', 'unknown', 'void']
    const numericTypes = ['float', 'double', 'int', 'integer', 'decimal', 'long', 'short']
    
    // Normalizar o tipo para minúsculas para comparação consistente
    const formattedType = type.toLowerCase()
  
    // Verificar se é um enum
    if (isEnum) {
      // Para enums, retornamos o tipo original, pois precisamos manter a referência ao enum
      return type
    }
  
    // Converter datetime para Date
    if (formattedType === 'datetime') {
      return 'Date'      
    }
    
    // Converter todos os tipos numéricos para number
    if (numericTypes.includes(formattedType)) {
      return 'number'
    }
    
    // Manter tipos primitivos como estão
    if (primitiveTypes.includes(formattedType) && !isRelation) {
      return formattedType
    }
    
    // Retornar o tipo original para outros casos
    return type
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

  /**
   * Handlebars helper to concatenate two strings
   */
  Handlebars.registerHelper('concat', (str1: string, str2: string): string => {
    return str1 + str2
  })

  Handlebars.registerHelper('ne', (a: any, b: any) => {
    return a !== b
  })

  Handlebars.registerHelper('or', (a: any, b: any) => {
    return a || b
  })

  Handlebars.registerHelper('isString', (value: any) => {
    return typeof value === 'string'
  });
}
