# Documentação dos Services no Igniter Framework

Este documento tem como objetivo apresentar de forma detalhada a estrutura, as responsabilidades e as boas práticas para a implementação dos Services no Igniter Framework. Utilizaremos como exemplo uma feature “User” básica para ilustrar cada aspecto. Este guia foi elaborado para auxiliar novos desenvolvedores a compreender as nuances da camada de Services, enfatizando a utilização do objeto `this.rules` – que simplifica a validação dos dados – e a manutenção das regras de negócio (Regra de Negócio:). Neste guia você irá encontrar exemplos robustos e variados, com aproximadamente 2000 palavras, que demonstram cada aspecto do funcionamento dos Services no Igniter JS.

---

## 1. Introdução

No Igniter Framework, os **Services** são a camada central onde toda a lógica de negócio é processada. Eles atuam como intermediários entre os Controllers – que recebem as requisições dos clientes – e os Repositories/Providers, responsáveis pela persistência ou integração com serviços externos. Essa camada garante que os dados sejam validados, processados e transformados de acordo com regras de negócio bem definidas, contribuindo para a consistência e robustez de toda a aplicação.

Cada Service é implementado estendendo a classe base `IgniterService`. Essa classe fornece o objeto `this.rules`, que reúne métodos utilitários para validação e verificação de invariantes. Esses métodos permitem que o Service verifique de maneira simples se os dados obedecem aos critérios necessários antes de prosseguir com a operação. Dessa forma, o código se torna limpo, sem estruturas condicionais (como o uso de "if"), e as mensagens de erro ficam padronizadas e claras.

Este documento fornece uma visão detalhada de como estruturar e implementar um Service, com foco em boas práticas e exemplos práticos. A ideia é que ao final deste guia, o desenvolvedor possa criar Services consistentes, utilizando os métodos de validação incorporados e seguindo as melhores práticas do Igniter Framework.

---

## 2. Estrutura e Organização dos Services

### 2.1 Localização e Nomenclatura

Os arquivos de Service devem ser organizados dentro da pasta da feature, geralmente em um diretório dedicado aos Services. Por exemplo, para uma feature User, os Services devem estar armazenados em um diretório correspondente à feature. O arquivo principal do Service costuma ser nomeado de forma a refletir sua responsabilidade, como por exemplo `UserService.ts`.

**Observação:** Evite expor os caminhos exatos de pastas internos da lib do Igniter, pois esses detalhes serão abstraídos para que a lib seja utilizada de forma encapsulada.

### 2.2 Herança e Injeção de Dependência

Todos os Services devem estender a classe base `IgniterService`, que provê o objeto `this.rules`. Tal abordagem permite a centralização das validações e a redução de boilerplate. Além disso, os Services devem utilizar injeção de dependência para receber os Providers ou Repositories necessários à execução de suas operações. Essa prática torna o código mais modular e facilita a escrita de testes unitários.

Exemplo de estrutura básica:
```typescript
import { IgniterService } from '@igniter/core'
import type { UserDTOs } from "../user.types"
import type { AuthProvider } from "@/providers/auth"

export class UserService extends IgniterService {
  constructor(private readonly authProvider: AuthProvider) {
    super()
  }

  // Métodos do Service serão definidos aqui...
}
```
Esse padrão promove a manutenção do código em ambientes colaborativos, facilitando a substituição ou atualização dos componentes necessários.

---

## 3. Utilização do Objeto `this.rules`

Um dos grandes diferenciais dos Services no Igniter é o uso do objeto `this.rules`, presente na classe `IgniterService`. Ele reúne métodos que permitem realizar validações de forma concisa e declarativa, eliminando a necessidade de condicionais explícitas. Com `this.rules`, o Service pode declarar as regras de negócio de maneira direta, garantindo que dados inválidos não sejam processados.

### 3.1 Métodos de `this.rules`

Alguns dos métodos mais utilizados incluem:

- **toBeDefined(value, message):**  
  Garante que um valor não seja `null` ou `undefined`.  
  *Exemplo:*  
  ```typescript
  this.rules.toBeDefined(data.body, 'Regra de Negócio: Body deve estar definido')
  ```

- **toBeValidEmail(value, message):**  
  Verifica se o endereço de email é válido, utilizando uma expressão regular interna.  
  *Exemplo:*  
  ```typescript
  this.rules.toBeValidEmail(data.body.email, 'Regra de Negócio: Email inválido')
  ```

- **toBeAtLeast(value, min, message):**  
  Assegura que um campo (geralmente uma string) atinja um comprimento mínimo.  
  *Exemplo:*  
  ```typescript
  this.rules.toBeAtLeast(data.body.password, 8, 'Regra de Negócio: A senha deve ter no mínimo 8 caracteres')
  ```

- **toBeTruthy(value, message):**  
  Verifica se um valor é verdade, sem precisar de condicionais.
  
Esses métodos promovem a consistência e eliminam a necessidade de estruturas "if". Em cada chamada, se a condição não for atendida, o método lança um erro padronizado, interrompendo imediatamente o fluxo do Service e evitando que operações com dados inconsistentes sejam realizadas.

### 3.2 Benefícios de Utilizar `this.rules`

- **Consistência:**  
  Todos os métodos de validação seguem o mesmo padrão, lançando erros com mensagens unitárias e claras, o que facilita a depuração.
  
- **Código Conciso:**  
  A eliminação de estruturas condicionais redundantes torna o código mais limpo e legível.
  
- **Centralização das Validações:**  
  Qualquer atualização na lógica de validação pode ser feita centralizadamente, beneficiando todos os métodos que a utilizam.

Exemplo comparativo:  
Sem `this.rules`, você escreveria algo como:
```typescript
if (!data.body) {
  throw new Error('Body must be defined')
}
```
Com `this.rules`, a mesma validação se converte em:
```typescript
this.rules.toBeDefined(data.body, 'Regra de Negócio: Body deve estar definido')
```
Essa simplicidade melhora a manutenção e a compreensão do código.

---

## 4. Exemplos Práticos de Implementação

Nesta seção, abordaremos exemplos robustos e variados, demonstrando a implementação completa dos métodos nos Services, todos sem utilizar estruturas condicionais explícitas.

### 4.1 Exemplo de Criação de Usuário

O método de criação de usuário assegura que os dados essenciais estejam presentes e válidos. A seguir, um exemplo detalhado sem uso de "if":

```typescript
import { IgniterService } from '@igniter/core'
import type { UserDTOs } from "../user.types"
import type { AuthProvider } from "@/providers/auth"

export class UserService extends IgniterService {
  constructor(private readonly authProvider: AuthProvider) {
    super()
  }
  
  // Regra de Negócio: Criação de um novo usuário
  create = (data: UserDTOs['create']) => {
    // Validações com this.rules:
    this.rules.toBeDefined(data.body, 'Regra de Negócio: Body deve estar definido')
    this.rules.toBeDefined(data.body.email, 'Regra de Negócio: Email deve ser informado')
    this.rules.toBeValidEmail(data.body.email, 'Regra de Negócio: Email inválido')
    this.rules.toBeDefined(data.body.password, 'Regra de Negócio: Senha deve ser informada')
    this.rules.toBeAtLeast(data.body.password, 8, 'Regra de Negócio: A senha deve ter no mínimo 8 caracteres')
    
    // Execução da criação através do provider
    return this.authProvider.user.create({ body: data.body })
  }
}
```

Neste exemplo, o fluxo do método `create` é linear e claro: as validações ocorrem sequencialmente e, somente se todas forem bem-sucedidas, a operação prossegue para a criação do usuário. O uso de `this.rules` elimina a necessidade de estruturas condicionais, melhorando a legibilidade.

### 4.2 Exemplo de Atualização de Usuário

Para atualizar os dados de um usuário, o Service valida tanto os parâmetros que identificam o usuário quanto os dados que serão atualizados, de maneira direta:

```typescript
import { IgniterService } from '@igniter/core'
import type { UserDTOs } from "../user.types"
import type { UserRepository } from "../repositories/user.repository"

export class UserService extends IgniterService {
  constructor(private readonly userRepository: UserRepository) {
    super()
  }
  
  update = (data: UserDTOs['update']) => {
    // Validações utilizando this.rules
    this.rules.toBeDefined(data.params, 'Regra de Negócio: Params devem estar definidos')
    this.rules.toBeDefined(data.params.userId, 'Regra de Negócio: User ID deve ser informado')
    this.rules.toBeDefined(data.body, 'Regra de Negócio: Body de atualização deve estar definido')
    
    // Atualização realizada no repositório
    return this.userRepository.update({
      where: { id: data.params.userId },
      data: data.body
    })
  }
}
```

O método `update` demonstra a clareza da abordagem: cada verificação é feita de forma declarativa, e a operação de atualização só é invocada se todas as validações forem satisfeitas.

### 4.3 Exemplo de Deleção de Usuário

A deleção de um usuário é também simplificada pela abordagem do `this.rules`, que garante que o identificador do usuário esteja presente:

```typescript
import { IgniterService } from '@igniter/core'
import type { UserDTOs } from "../user.types"
import type { UserRepository } from "../repositories/user.repository"

export class UserService extends IgniterService {
  constructor(private readonly userRepository: UserRepository) {
    super()
  }
  
  // Regra de Negócio: Deleção de um usuário
  delete = (data: UserDTOs['delete']) => {
    // Validação direta dos parâmetros
    this.rules.toBeDefined(data.params, 'Regra de Negócio: Params devem estar definidos')
    this.rules.toBeDefined(data.params.userId, 'Regra de Negócio: User ID deve ser informado')
    
    // Chama o repositório para remover o usuário
    return this.userRepository.delete({
      where: { id: data.params.userId }
    })
  }
}
```

Este exemplo ilustra como a validação dos dados de entrada é realizada de maneira declarativa e sequencial, garantindo que a deleção só ocorra se o `userId` estiver corretamente fornecido.

---

## 5. Integração e Fluxo de Processamento Sem Uso de Condicionais

Um desafio comum em serviços complexos é a necessidade de manejar múltiplos cenários sem recorrer a estruturas condicionais pesadas. Com a padronização dos DTOs e o uso de `this.rules`, os Services conseguem delegar a lógica de seleção para os Providers ou Repositories.

Por exemplo, ao invés de utilizar "if" para determinar qual estratégia de autenticação usar, o Service pode simplesmente passar o DTO completo para o provider, que já possui a lógica interna para interpretar os dados. Essa abordagem não só simplifica o código como fortalece a separação de responsabilidades.

Um exemplo de um método que delega a lógica de autenticação, sem ifs, é:

```typescript
import { IgniterService } from '@igniter/core'
import type { UserDTOs } from "../user.types"
import type { AuthProvider } from "@/providers/auth"

export class UserService extends IgniterService {
  constructor(private readonly authProvider: AuthProvider) {
    super()
  }
  
  // Regra de Negócio: Autenticação do usuário
  signIn = (data: UserDTOs['signIn']) => {
    // Validação dos dados de entrada
    this.rules.toBeDefined(data.body, 'Regra de Negócio: Body deve estar definido')
    this.rules.toBeDefined(data.body.strategy, 'Regra de Negócio: Strategy deve ser informada')
    
    // Delegação completa do DTO para o provider, que lida com a estratégia apropriada
    return this.authProvider.user.signIn({ body: data.body })
  }
}
```

Neste exemplo, a lógica condicional é delegada ao provider que, baseando-se no campo `strategy`, escolhe o fluxo de autenticação apropriado. Assim, o Service mantém a sua estrutura linear e as regras de negócio são aplicadas de forma declarativa.

---

## 6. Metodologia de Testes para Services

Testar os Services é essencial para garantir a robustez das regras de negócio. A metodologia de testes deve abranger:

- **Validação de Entradas:**  
  Confirma que as chamadas a `this.rules` lançam os erros apropriados quando os dados não cumprem os requisitos.

- **Fluxo de Dados Correto:**  
  Verifica se, após a validação, os métodos dos Providers ou Repositories são invocados com os dados corretos.

- **Isolamento de Dependências:**  
  Utilizando mocks para os Providers e Repositórios, é possível isolar a lógica do Service e garantir que o comportamento seja conforme esperado.

### Exemplo de Teste Unitário

```typescript
import { UserService } from '../services/user.service'
import type { UserDTOs } from '../user.types'

describe('UserService.create', () => {
  let userService: UserService
  const mockAuthProvider = {
    user: {
      create: jest.fn().mockResolvedValue({ id: '123', email: 'test@example.com' })
    }
  }

  beforeEach(() => {
    userService = new UserService(mockAuthProvider as any)
  })

  it('deve lançar erro se body estiver indefinido', async () => {
    await expect(userService.create({} as UserDTOs['create']))
      .rejects
      .toThrow('Regra de Negócio: Body must be defined')
  })

  it('deve criar um usuário com dados válidos', async () => {
    const data = {
      body: {
        email: 'test@example.com',
        password: 'Password123!'
      }
    }
    const result = await userService.create(data as UserDTOs['create'])
    expect(result).toHaveProperty('id')
    expect(mockAuthProvider.user.create).toHaveBeenCalledWith({ body: data.body })
  })
})
```

Neste teste, os casos de sucesso e falha são cobertos, verificando que os métodos de validação são invocados e que a chamada ao provider é feita corretamente.

---

## 7. Vantagens da Abordagem do Igniter Framework

A abordagem baseada em `this.rules` e na estrutura declarativa dos Services traz diversas vantagens:
- **Legibilidade e Manutenção:**  
  Código mais limpo e fácil de entender, pois não há dispersão de condicionais.
- **Centralização das Validações:**  
  Qualquer alteração na validação interfere em todos os métodos que usam `this.rules`, simplificando a manutenção.
- **Consistência:**  
  Garantia de que todas as operações seguem o mesmo padrão, reduzindo erros e facilitando o trabalho do time de desenvolvimento.
- **Testabilidade:**  
  Devido à simplicidade e modularidade, os Services se tornam fáceis de isolar e testar.

---

## 8. Considerações Finais

Os Services são fundamentais no Igniter Framework para a implementação de regras de negócio. Ao utilizar uma abordagem declarativa e centralizada, por meio do objeto `this.rules`, é possível criar uma camada robusta, segura e de fácil manutenção. Este documento apresentou exemplos detalhados e diversos cenários que ilustram como aplicar as regras de negócio sem recorrer a estruturas condicionais, garantindo que a lógica seja sempre clara e padronizada.

Além disso, a padronização dos DTOs e a integração harmoniosa com Providers e Repositories asseguram que os dados sejam processados corretamente, promovendo a criação de aplicações escaláveis e consistentes.

Recomenda-se que os desenvolvedores consultem a documentação dos utilitários de validação e os testes unitários para entender profundamente cada método disponível em `this.rules` e aprimorar as implementações de seus Services.

---

*Este documento foi elaborado para fornecer aproximadamente 2000 palavras de conteúdo detalhado sobre os Services no Igniter Framework. Se houver dúvidas ou a necessidade de exemplos adicionais, consulte os demais documentos da documentação (Controllers, Validators, Repositories, Middlewares, Router e Configuração de Features) para uma compreensão integrada do framework.*
