import fs from 'fs'
import path from 'path'

interface ParsedField {
  name: string
  type: string
  zodType: string
  description: string
  isRelation: boolean
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
    const fields = this.parseFields(fieldsContent)

    // Transform parsed fields to include relationship info
    return fields.map(field => ({
      ...field,
      isRelation: !!field.relations || this.schemaContent.includes(`model ${field.type} {`),
      isList: field.isList || (field.relations?.type === 'one-to-many' || field.relations?.type === 'many-to-many'),
      isOptional: field.hasDefault || field.isOptional
    }))
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
        console.log(field)
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
    const fieldPattern = /^(\w+)\s+(\w+)(?:\?|\[\])?\s*(@[^\n]+)?$/
    const match = line.match(fieldPattern)

    if (!match) return null

    const [, name, type] = match
    const modifiers = line.slice(match[0].length).trim()

    const isOptional = line.includes('?')
    const isList = line.includes('[]')
    const hasDefault = line.includes('@default')

    // Check if type is a model (potential relation)
    const isModelType = this.schemaContent.includes(`model ${type} {`)
    
    // Parse relations
    let relations = undefined
    let isRelation = false
    
    if (line.includes('@relation') || isModelType) {
      const relationMatch = line.match(/@relation\([^)]*\)/)
      
      if (relationMatch) {
        relations = this.parseRelation(relationMatch[0], isList)
        isRelation = true
      } else if (isModelType) {
        // If it's a model type but doesn't have @relation, create a default relation
        relations = {
          type: isList ? 'one-to-many' : 'one-to-one',
          model: type,
          fields: [name + 'Id'],
          references: ['id']
        } as any
        isRelation = true
      }
    }

    // Verifica se é um enum
    const isEnum = this.schemaContent.includes(`enum ${type} {`)

    return {
      name,
      type,
      zodType: this.getZodType(type, isOptional || hasDefault, isList),
      description: `${name} field`,
      isOptional: isOptional || hasDefault,
      isList,
      hasDefault,
      isEnum,
      relations,
      isRelation
    }
  }

  /**
   * Parses a relation decorator into a structured object
   */
  private parseRelation(relationString: string, isList: boolean): { type: 'one-to-one' | 'one-to-many' | 'many-to-many'; model: string; fields: string[]; references: string[] } | undefined {
    try {
      // Extract details from @relation(...) string
      const relationDetails = relationString.match(/@relation\(([^)]+)\)/)?.[1].trim();
      if (!relationDetails) return undefined;

      // Extract fields and references from the relation
      const fieldsMatch = relationDetails.match(/fields:\s*\[\s*([^\]]+)\s*\]/);
      const referencesMatch = relationDetails.match(/references:\s*\[\s*([^\]]+)\s*\]/);
      
      if (fieldsMatch && referencesMatch) {
        // Get fields and references
        const fields = fieldsMatch[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
        const references = referencesMatch[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
        
        // Try to find referenced model from the context
        let model = '';
        
        // Check if there's an explicit model name attribute
        const modelMatch = relationDetails.match(/name:\s*['"]?(\w+)['"]?/);
        if (modelMatch) {
          model = modelMatch[1];
        } else {
          // Infer model from schema by looking at field references
          // This is a simplification - in a real implementation you might need to look at
          // the other side of the relation in the schema
          const referenceField = references[0].replace(/['"]/g, '');
          if (referenceField === 'id') {
            // Try to find "@relation(fields: [categoryId], references: [id])"
            // Where categoryId indicates a Category model
            const possibleModelField = fields[0];
            if (possibleModelField && possibleModelField.toLowerCase().endsWith('id')) {
              // Extract model name by removing the 'Id' suffix
              model = possibleModelField.substring(0, possibleModelField.length - 2);
              // Convert first letter to uppercase for proper model name format
              model = model.charAt(0).toUpperCase() + model.slice(1);
            }
          }
        }
        
        // Determine relation type based on list status and fields/references count
        let relationType: 'one-to-one' | 'one-to-many' | 'many-to-many';
        if (fields.length > 1 || references.length > 1) {
          relationType = 'many-to-many';
        } else if (isList) {
          relationType = 'one-to-many';
        } else {
          relationType = 'one-to-one';
        }
        
        return {
          type: relationType,
          model,
          fields,
          references
        };
      }
    } catch (error) {
      console.log(`Error parsing relation: ${error}`);
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