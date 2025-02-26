import fs from 'fs'
import path from 'path'

interface ParsedField {
  name: string
  type: string
  zodType: string
  description: string
  isOptional: boolean
  isList: boolean
  hasDefault: boolean
  isEnum?: boolean
  enumValues?: string[]
  relations?: {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many'
    model: string
    fields: string[]
    references: string[]
  }
}

export class PrismaSchemaParser {
  private readonly schemaPath: string
  private schemaContent: string = ''

  constructor(basePath: string = process.cwd()) {
    this.schemaPath = path.join(basePath, 'prisma/schema.prisma')
  }

  /**
   * Loads the Prisma schema file content
   */
  private loadSchema(): void {
    if (!fs.existsSync(this.schemaPath)) {
      throw new Error('Prisma schema file not found')
    }
    this.schemaContent = fs.readFileSync(this.schemaPath, 'utf-8')
  }

  /**
   * Gets the raw schema content
   */
  public getSchemaContent(): string {
    this.loadSchema()
    return this.schemaContent
  }

  /**
   * Checks if a model exists in the Prisma schema
   */
  public hasModel(modelName: string): boolean {
    this.loadSchema()
    const modelRegex = new RegExp(`model\\s+${modelName}\\s*{`, 'i')
    return modelRegex.test(this.schemaContent)
  }

  /**
   * Gets fields from a specific model
   */
  public getModelFields(modelName: string): ParsedField[] {
    this.loadSchema()
    if (!this.hasModel(modelName)) {
      return []
    }

    const modelRegex = new RegExp(`model\\s+${modelName}\\s*{([^}]*)}`, 'i')
    const modelMatch = this.schemaContent.match(modelRegex)
    
    if (!modelMatch || !modelMatch[1]) {
      return []
    }

    const fieldsContent = modelMatch[1].trim()
    return this.parseFields(fieldsContent)
  }

  /**
   * Parses field strings into structured field objects
   */
  private parseFields(fieldsContent: string): ParsedField[] {
    this.loadSchema()
    const fieldLines = fieldsContent.split('\n')
    const fields: ParsedField[] = []

    for (const line of fieldLines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('@@')) continue

      const field = this.parseFieldLine(trimmedLine)
      if (field) {
        fields.push(field)
      }
    }

    return fields
  }

  /**
   * Parses a single field line into a structured field object
   */
  private parseFieldLine(line: string): ParsedField | null {
    this.loadSchema()
    // Basic field pattern: name type modifiers
    const fieldPattern = /^(\w+)\s+(\w+)(\?|\[\])?\s*(@\w+(?:\([^)]*\))?)*$/
    const match = line.match(fieldPattern)

    if (!match) return null

    const [, name, type] = match
    const modifiers = line.slice(match[0].length).trim()

    const isOptional = line.includes('?')
    const isList = line.includes('[]')
    const hasDefault = modifiers.includes('@default')

    // Skip internal Prisma fields
    if (['id', 'createdAt', 'updatedAt'].includes(name)) {
      return null
    }

    // Verifica se é um enum
    const isEnum = this.schemaContent.includes(`enum ${type} {`)

    // Parse relations
    let relations = undefined
    if (line.includes('@relation')) {
      const relationMatch = line.match(/@relation\([^)]*\)/)
      if (relationMatch) {
        relations = this.parseRelation(relationMatch[0], isList)
      }
    }

    return {
      name,
      type,
      zodType: this.getZodType(type, isOptional, isList),
      description: `${name} field`,
      isOptional,
      isList,
      hasDefault,
      isEnum,
      relations
    }
  }

  /**
   * Parses a relation decorator into a structured object
   */
  private parseRelation(relationString: string, isList: boolean): { type: 'one-to-one' | 'one-to-many' | 'many-to-many'; model: string; fields: string[]; references: string[] } | undefined {
    const relationDetails = relationString.match(/@relation\(([^)]+)\)/)?.[1].split(',');
    if (!relationDetails) return undefined;

    const nameMatch = relationDetails.find(detail => detail.trim().startsWith('name:'));
    const fieldsMatch = relationDetails.find(detail => detail.trim().startsWith('fields:'));
    const referencesMatch = relationDetails.find(detail => detail.trim().startsWith('references:'));

    if (nameMatch && fieldsMatch && referencesMatch) {
      const model = nameMatch.split(':')[1].trim().replace(/['"]/g, '');
      const fields = fieldsMatch.split(':')[1].trim().replace(/\[|\]/g, '').split(',').map(f => f.trim());
      const references = referencesMatch.split(':')[1].trim().replace(/\[|\]/g, '').split(',').map(f => f.trim());

      return {
        type: fields.length > 1 || references.length > 1 ? 'many-to-many' : (isList ? 'one-to-many' : 'one-to-one'),
        model,
        fields,
        references
      };
    }

    return undefined;
  }

  /**
   * Decodes HTML entities in a string
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x60;/g, '`')
  }

  /**
   * Converts Prisma types to Zod types
   */
  private getZodType(type: string, isOptional: boolean = false, isList: boolean = false): string {
    this.loadSchema()
    // Verifica se é um enum primeiro
    const enumMatch = this.schemaContent.match(new RegExp(`enum\\s+${type}\\s*{([^}]*)}`, 'i'))
    if (enumMatch) {
      const enumValues = enumMatch[1]
        .trim()
        .split('\n')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => this.decodeHtmlEntities(v)) // Decodifica HTML entities
        .map(v => v.replace(/['"]/g, '').trim())
      
      return `z.enum([${enumValues.map(v => `'${v}'`).join(', ')}])`
    }

    const uuidMatch = this.schemaContent.match(/@default\(uuid\((\d+)?\)\)/)
    const uuidVersion = uuidMatch ? (uuidMatch[1] || '4') : null

    const typeMap: Record<string, string> = {
      'String': 'z.string()',
      'Int': 'z.number().int()',
      'Float': 'z.number()',
      'Boolean': 'z.boolean()',
      'DateTime': 'z.date()',
      'Json': 'z.any()',
      'BigInt': 'z.bigint()',
      'Decimal': 'z.number()',
      'Bytes': 'z.instanceof(Buffer)',
      'UUID': `z.string().uuid(${uuidVersion ? `{ version: ${uuidVersion} }` : ''})`,
    }

    // Handle relationships
    if (!typeMap[type]) {
      if (isList) {
        return 'z.array(z.string().min(1))'
      }
      
      return 'z.string().min(1)'
    }

    let zodType = typeMap[type] || 'z.any()'

    if (isList) {
      zodType = `z.array(${zodType})`
    }

    if (isOptional) {
      zodType = `${zodType}.optional().nullable()`
    }

    return zodType
  }
}