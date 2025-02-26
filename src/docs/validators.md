# Documentação dos Validators no Igniter Framework

Este documento tem como objetivo apresentar de forma detalhada a estrutura, as responsabilidades e as boas práticas para a implementação dos Validators no Igniter Framework. Para exemplificar, utilizaremos a feature **User** – um exemplo comum e representativo. Ao final, você encontrará exemplos robustos para operações de criação, obtenção, atualização e deleção, bem como orientações sobre a integração com os Controllers e a derivação das tipagens via `InferZodValidtor`.

---

## 1. Introdução

No Igniter Framework, os **Validators** são essenciais para garantir que os dados provenientes das requisições HTTP estejam em conformidade com os formatos esperados antes de serem processados pela camada de Services. Através da utilização do `ZodValidator`, os Validators permitem definir schemas de validação de forma declarativa e tipada, assegurando que cada operação possua as regras de negócio necessárias para manter a integridade dos dados.

Utilizando a biblioteca [Zod](https://github.com/colinhacks/zod) como base, o `ZodValidator` simplifica o processo de criação dos schemas, fornecendo métodos que ajudam a descrever a estrutura dos dados recebidos em propriedades como `body`, `query`, `params` e `state`. Esses schemas são fundamentais para que os Controllers possam passar dados validados para os Services, reduzindo a ocorrência de erros de entrada e melhorando a segurança e a robustez da aplicação.

Neste documento, vamos abordar:
- A finalidade dos Validators e a importância do `ZodValidator`.
- A estrutura dos schemas para operações comuns (create, get, update e delete).
- Exemplos detalhados, utilizando a feature **User**.
- A integração dos Validators com os Controllers e a utilização do `InferZodValidtor` para derivar os tipos (DTOs).
- Boas práticas para a definição de mensagens de erro e documentação dos schemas.

---

## 2. O Papel dos Validators e do `ZodValidator`

### 2.1 Objetivos dos Validators
Os Validators têm a missão de:
- **Verificar a integridade dos dados:** Assegurando que informações obrigatórias estejam presentes e corretas antes de serem processadas.
- **Centralizar a validação:** Permitir que todos os requisitos de entrada sejam definidos em um único local, facilitando a manutenção e a atualização futura.
- **Facilitar o uso de tipagem:** Integrar com o sistema de tipos do TypeScript por meio de utilitários como o `InferZodValidtor`, garantindo que os DTOs estejam sempre sincronizados com os schemas.

### 2.2 Utilizando o `ZodValidator`
O `ZodValidator` é uma abstração que utiliza a biblioteca Zod para definir schemas de validação. Em vez de escrever validações imperativas com condicionais (por exemplo, `if`), você declara a estrutura esperada dos dados utilizando uma sintaxe declarativa.

Exemplo básico:
```typescript
import { ZodValidator } from '@igniter/modules'

export const UserValidator = new ZodValidator()
  .use({
    name: 'create',
    schema: (z) => z.object({
      body: z.object({
        // O nome do usuário é obrigatório e deve ser uma string não vazia
        name: z.string().min(1, 'Regra de Negócio: O nome é obrigatório'),
        // Email deve ter formato válido
        email: z.string().email('Regra de Negócio: Email inválido'),
        // Senha tem regra de tamanho mínimo
        password: z.string().min(8, 'Regra de Negócio: A senha deve ter no mínimo 8 caracteres')
      })
    })
  })
```
Esse exemplo demonstra como definir um schema para a operação de criação de um usuário, onde se espera que o objeto enviado na propriedade `body` contenha `name`, `email` e `password` com restrições específicas. Notavelmente, o método `min` do Zod é utilizado para assegurar o comprimento mínimo e o método `email` para a validação do formato de e-mail. As mensagens de erro são personalizadas para refletirem as regras de negócio.

---

## 3. Definindo Schemas para Operações Comuns

Para construir Validators robustos, é necessário definir schemas para cada operação que a feature realiza. A seguir, apresentamos exemplos adaptados para a feature **User**.

### 3.1 Operação de Criação (Create)
O schema de criação define os dados necessários para criar um usuário. Ele foca principalmente na propriedade `body`.
```typescript
.use({
  name: 'create',
  schema: (z) => z.object({
    body: z.object({
      // Nome é obrigatório
      name: z.string().min(1, 'Regra de Negócio: O nome é obrigatório'),
      // Email deve ter formato válido
      email: z.string().email('Regra de Negócio: Email inválido'),
      // Senha deve ter, no mínimo, 8 caracteres
      password: z.string().min(8, 'Regra de Negócio: A senha deve ter no mínimo 8 caracteres')
    })
  })
})
```
Neste schema, o objeto `body` deve conter os campos essenciais. Se algum dos requisitos não for satisfeito, o ZodValidator lançará um erro com a mensagem especificada, interrompendo o fluxo de processamento.

### 3.2 Operação de Obtenção (Get)
O schema de obtenção pode incluir validação de dados enviados tanto no `body` quanto em `params`. Para simplificar o exemplo, vamos usar uma estrutura básica para obter um usuário, considerando que a requisição poderá identificar o usuário por ID.

```typescript
.use({
  name: 'get',
  schema: (z) => z.object({
    params: z.object({
      userId: z.string().min(1, 'Regra de Negócio: User ID deve ser informado')
    })
  })
})
```
Este schema garante que ao buscar um usuário, o parâmetro `userId` esteja presente e seja uma string não vazia. Esse modelo pode ser expandido para aceitar outros identificadores, se necessário.

### 3.3 Operação de Atualização (Update)
Para atualizar os dados de um usuário, o schema deve validar tanto os parâmetros (por exemplo, o ID do usuário) quanto os dados de atualização.

```typescript
.use({
  name: 'update',
  schema: (z) => z.object({
    params: z.object({
      userId: z.string().min(1, 'Regra de Negócio: User ID deve ser informado')
    }),
    body: z.object({
      // Os campos para atualização são geralmente opcionais
      name: z.string().optional(),
      email: z.string().email('Regra de Negócio: Email inválido').optional(),
      password: z.string().min(8, 'Regra de Negócio: A senha deve ter no mínimo 8 caracteres').optional()
    })
  })
})
```
Esse schema define um objeto que tem uma propriedade `params`, que deve conter o `userId`, e um `body` onde todos os campos são opcionais – permitindo a atualização parcial dos dados.

### 3.4 Operação de Deleção (Delete)
No caso de deleção, normalmente apenas os parâmetros necessários para identificar o recurso são validados.

```typescript
.use({
  name: 'delete',
  schema: (z) => z.object({
    params: z.object({
      userId: z.string().min(1, 'Regra de Negócio: User ID deve ser informado')
    })
  })
})
```
Isso garante que o identificador do usuário esteja presente para que a deleção ocorra corretamente.

---

## 4. Integração com Types e Controllers

### 4.1 Inferindo Tipos com `InferZodValidtor`

É fundamental que os Validators sejam integrados ao sistema de tipos do Igniter para que os DTOs sejam automaticamente derivados dos schemas. Por exemplo, no arquivo de tipos da feature User, você pode definir:

```typescript
import { InferZodValidtor } from '@igniter/modules'
import { UserValidator } from './validators/user.validator'

export type UserDTOs = InferZodValidtor<typeof UserValidator>
```

Dessa forma, os DTOs estarão sempre sincronizados com os schemas, garantindo que os dados recebidos sejam corretamente tipados e validados.

### 4.2 Uso dos Validators nos Controllers

Os Controllers esperam que o objeto que chega possua as seguintes propriedades:
- **body:** Dados enviados no corpo da requisição.
- **query:** Parâmetros enviados na URL (query string).
- **params:** Parâmetros extraídos da rota, como um ID.
- **state:** Informações contextuais da requisição, como dados de sessão ou autenticação.

Ao definir uma rota, o Controller utiliza o método `get` do Validator para obter o schema apropriado. Exemplo aplicado a uma feature de User:

```typescript
import { Controller, IgniterController, type IgniterContext } from "@igniter/modules";
import { UserService } from "../services/user.service";
import { UserValidator } from "../validators/user.validator";
import type { UserDTOs } from "../user.types";

export class UserController extends IgniterController {
  public name = 'user' as const;

  constructor(private readonly service: UserService) {
    super();
  }

  @Controller({
    name: 'create',
    schema: UserValidator.get('create'),
  })
  public async create(ctx: IgniterContext<UserDTOs['create']>) {
    // Regra de Negócio: Criação de um novo usuário
    const user = await this.service.create(ctx.request);
    return ctx.response.status(201).json(user);
  }

  @Controller({
    name: 'update',
    schema: UserValidator.get('update'),
  })
  public async update(ctx: IgniterContext<UserDTOs['update']>) {
    // Regra de Negócio: Atualização de um usuário
    const user = await this.service.update(ctx.request);
    return ctx.response.status(200).json(user);
  }

  @Controller({
    name: 'delete',
    schema: UserValidator.get('delete'),
  })
  public async delete(ctx: IgniterContext<UserDTOs['delete']>) {
    // Regra de Negócio: Deleção de um usuário
    await this.service.delete(ctx.request);
    return ctx.response.status(204).noContent();
  }
}
```

Neste exemplo, o Controller utiliza os schemas definidos nos Validators para validar a entrada antes de chamar os métodos do Service.

---

## 5. Boas Práticas na Definição dos Validators

Para que os Validators sejam poderosos e flexíveis, recomenda-se seguir estas boas práticas:

### 5.1 Centralização dos Schemas

- **Pasta Dedicada:**  
  Armazene todos os Validators em uma pasta dedicada dentro da feature, por exemplo, `src/features/user/validators/`. Isso facilita a manutenção e a descoberta dos schemas utilizados.

### 5.2 Nomenclatura Consistente

- **Uso de Nomes Significativos:**  
  Cada operação deve ter um nome único, como `create`, `get`, `update`, `delete`. Esses nomes devem ser usados de forma consistente em toda a aplicação para facilitar a compreensão e a integração dos Validators com os Controllers.

### 5.3 Mensagens de Erro Claras e Consistentes

- **Especificação de Mensagens:**  
  As mensagens de erro devem ser formuladas de forma a indicar claramente qual regra de negócio foi violada. Por exemplo, “Regra de Negócio: Email inválido” ou “Regra de Negócio: User ID deve ser informado”. Isso ajuda na depuração e na melhoria contínua do código.

### 5.4 Integração com InferZodValidtor

- **Derivação Automática de Tipos:**  
  Utilize o `InferZodValidtor` para garantir que os DTOs estejam sempre atualizados conforme os schemas definidos, evitando discrepâncias entre a validação e os tipos utilizados nos Services e Controllers.

---

## 6. Exemplos Adicionais e Cenários de Uso

### 6.1 Cenário Adicional: Validação de Dados Compostas

Em casos onde os dados de entrada necessitam validações complexas (por exemplo, telefone ou endereço), o Zod permite compor schemas de forma aninhada. Por exemplo, para validar dados de endereço:

```typescript
.use({
  name: 'UpdateAddress',
  schema: (z) => z.object({
    params: z.object({
      userId: z.string().min(1, 'Regra de Negócio: User ID deve ser informado')
    }),
    body: z.object({
      address: z.object({
        street: z.string().min(1, 'Regra de Negócio: Nome da rua é obrigatório'),
        city: z.string().min(1, 'Regra de Negócio: Cidade é obrigatória'),
        postalCode: z.string().min(5, 'Regra de Negócio: CEP deve ter pelo menos 5 caracteres')
      })
    })
  })
})
```

Com este schema, a validação é realizada em duas camadas: primeiro, a presença do `userId` nos parâmetros e, em seguida, a validação detalhada do objeto `address` dentro do body. Essa composição permite que os Validators sejam altamente expressivos e modularizem as validações de componentes complextos.

### 6.2 Validação de Arrays e Objetos Complexos

A biblioteca Zod possibilita a validação de arrays e objetos com múltiplos campos. Por exemplo, se um usuário puder enviar uma lista de hobbies:

```typescript
.use({
  name: 'UpdateHobbies',
  schema: (z) => z.object({
    params: z.object({
      userId: z.string().min(1, 'Regra de Negócio: User ID deve ser informado')
    }),
    body: z.object({
      hobbies: z.array(z.string().min(1, 'Cada hobby deve ser uma string não vazia')).min(1, 'Regra de Negócio: Pelo menos um hobby deve ser informado')
    })
  })
})
```

Este exemplo demonstra como garantir que a propriedade `hobbies` seja um array que contenha pelo menos um item e que cada item seja uma string válida.

---

## 7. Conclusão

Os Validators desempenham um papel crucial no Igniter Framework, garantindo que os dados de entrada sejam rigorosamente verificados antes de serem processados. Ao utilizar o `ZodValidator`, os desenvolvedores podem definir regras de validação de forma declarativa e centralizada, o que resulta em código mais limpo e de fácil manutenção.

Por meio do uso do `InferZodValidtor`, os tipos (DTOs) derivados dos schemas ficam sempre alinhados com as validações, minimizando a chance de inconsistências entre os dados validados e os tipos esperados pelas camadas de Service e Controller.

Este documento demonstrou, com exemplos robustos e variados, como criar schemas para operações comuns (create, get, update, delete) e como integrá-los com Controllers. Além disso, foram apresentadas boas práticas que visam a padronização, a clareza e a facilidade de manutenção dos Validators no Igniter Framework.

Ao seguir as diretrizes aqui estabelecidas, os desenvolvedores poderão construir Validators que são não somente eficientes, mas também fáceis de entender e manter, promovendo a criação de aplicações seguras, escaláveis e robustas.