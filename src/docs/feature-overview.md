# Visão Geral da Estrutura de uma Feature no Igniter Framework

Esta documentação apresenta uma visão integrada de como uma feature é estruturada no Igniter Framework, utilizando o exemplo de uma feature “User” básica. Ela abrange todos os componentes essenciais, detalhando suas responsabilidades e como eles se interconectam.

---

## 1. Introdução

No Igniter, uma feature é um módulo autônomo que encapsula uma funcionalidade específica. Cada feature segue um padrão organizado que facilita a manutenção, escalabilidade e consistência do projeto. A estrutura básica inclui:

- **Controllers**
- **Services**
- **Repositories**
- **Validators**
- **Tipos e Configurações**
- **Arquivo de Feature (ex.: user.feature.ts)**
- **Ponto de Entrada (index.ts)**
- **Middlewares e Roteamento**

Este documento fornece uma visão geral de cada um desses componentes, exemplificando com uma feature de User – um exemplo comum e facilmente compreensível para novos desenvolvedores.

---

## 2. Componentes da Feature

### 2.1 Controllers
- **Localização:** `src/features/user/controllers/`
- **Função:** 
  - Gerenciar as requisições HTTP.
  - Validar entradas com o Validator.
  - Invocar os métodos do Service.
  - Exemplos incluem endpoints para criação, leitura, atualização e deleção de usuários.
- **Exemplo:** Um controller utilizando middlewares simples e outro integrando NextAuth para autenticação.

### 2.2 Services
- **Localização:** `src/features/user/services/`
- **Função:**
  - Contém as regras de negócio.
  - Interage com o repositório e providers.
  - Utiliza os DTOs (tipos derivados dos Validators) sem desestruturar os dados, preservando o padrão de acesso.
- **Exemplo:** Um método que cria um usuário validando dados e mantendo os comentários de Business Rules.

### 2.3 Repositories
- **Localização:** `src/features/user/repositories/`
- **Função:**
  - Gerencia o acesso e persistência de dados usando o Prisma ou outro ORM.
  - Encapsula a funcionalidade de CRUD.
- **Exemplo:** Um repositório que injetado no Service possibilita operações de criação, atualização e deleção de registros.

### 2.4 Validators
- **Localização:** `src/features/user/validators/`
- **Função:**
  - Define os schemas de validação para cada operação (e.g., create, update, get, delete) usando o ZodValidator.
  - Garante a integridade dos dados enviados nas requisições.
- **Exemplo:** Schemas de validação que impõem regras como e-mail válido ou presença obrigatória de campos específicos.

### 2.5 Tipos e Configurações
- **Localização:** `src/features/user/user.types.ts` ou arquivo similar.
- **Função:**
  - Define os DTOs (por meio do InferZodValidtor) e interfaces de repositório.
  - Agrupa e tipa todas as estruturas de dados utilizadas na feature.
- **Exemplo:** Declaração dos tipos `UserDTOs` e da interface `IUserRepository`.

### 2.6 Arquivo de Feature
- **Localização:** Ex.: `src/features/user/user.feature.ts`
- **Função:**
  - Configura a feature, seguindo o padrão singleton.
  - Agrega os principais componentes (Controller, Service) e estabelece as integrações necessárias (como a injeção de providers).
- **Exemplo:** A implementação que instancia o Service e o Controller e disponibiliza a feature via método `get()`.

### 2.7 Ponto de Entrada
- **Localização:** `src/features/user/index.ts`
- **Função:**
  - Agrega e exporta os componentes da feature (controllers, services, validators, tipos, repositórios).
  - Facilita a importação e utilização da feature no restante do sistema.
  
### 2.8 Middlewares e Roteamento
- **Middlewares:**
  - Podem ser simples ou integrados com soluções como NextAuth.
  - São aplicados nos Controllers para validar a autorização das requisições.
- **Roteamento:**
  - Configurado no arquivo index.ts da feature e integrado ao Igniter Router, definindo como as requisições são mapeadas para os Controllers.
- **Exemplo:** Configuração de middlewares básicos e um exemplo avançado utilizando NextAuth para proteção de endpoints.

---

## 3. Fluxo de Execução de uma Feature

1. **Entrada:**  
   O Controller recebe a requisição HTTP e aplica o respectivo schema de validação definidos no Validator.

2. **Processamento:**  
   O Service processa a solicitação, aplicando as regras de negócio. Se necessário, ele interage com o repositório para operações de persistência.

3. **Saída:**  
   O Controller retorna a resposta adequada ao cliente, com status e dados conforme definidos na regra de negócio.

---

## 4. Boas Práticas e Diretrizes

- **Consistência:**  
  Mantenha a estrutura e nomenclatura padronizadas em todas as features.

- **Modularidade:**  
  Cada componente (Controller, Service, etc.) deve ser autocontido e testável de forma isolada.

- **Validação Rigorosa:**  
  Utilize o ZodValidator para garantir que todas as requisições sejam validadas antes do processamento.

- **Comentários Focados:**  
  Mantenha os comentários apenas para explicar regras de negócio e pontos críticos, evitando documentação excessiva no código.

- **SEO e Documentação:**  
  Estruture os arquivos Markdown com títulos claros e links internos para promover uma boa indexação e navegação no site da documentação.

---

## 5. Conclusão

Esta visão geral enfatiza a importância de uma estrutura modular e bem definida para as features no Igniter Framework. Ao seguir esse padrão, os desenvolvedores garantem a escalabilidade, manutenção e consistência em todo o projeto.

Para detalhes específicos sobre cada componente, consulte os documentos dedicados (Controllers, Services, Repositories, Validators, Middlewares, Router e Configuração de Feature) que acompanham esta visão geral.
