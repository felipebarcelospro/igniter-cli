# Middlewares: Protegendo os seus controllers no IgniterJS

## 1. Introdução

Nesta seção, explicamos o papel dos middlewares no Igniter Framework. Os middlewares são funções interceptadoras que executam operações antes que as requisições cheguem aos controllers. Eles podem validar, transformar ou até mesmo interromper o fluxo das requisições, garantindo que apenas dados válidos e autorizados sejam processados. O Igniter utiliza o `IgniterMiddlewareContext`, que já integra propriedades essenciais como `request`, `response` e informações de configuração do middleware, simplificando a manipulação de redirecionamentos e respostas nativas do NextJS.

---

## 2. Conceitos e Estrutura dos Middlewares

### 2.1 Definição do Middleware

Esta seção apresenta a definição e a estrutura básica de um middleware no Igniter Framework. Um middleware é definido como um objeto que contém as seguintes propriedades:

- **name:** Nome identificador do middleware.  
- **options:** Parâmetros configuráveis que determinam o comportamento do middleware.  
- **execute:** Uma função assíncrona que recebe o contexto do middleware (`IgniterMiddlewareContext`). Essa função contém a lógica principal de interceptação, podendo modificar ou redirecionar a requisição conforme necessário.

Cada middleware é projetado para ser modular e reutilizável, permitindo que regras de autenticação, autorização e logging sejam centralizadas.

### 2.2 Propriedades do Contexto do Middleware

O contexto passado para o middleware, do tipo `IgniterMiddlewareContext`, possui informações essenciais para a execução da função. São eles:

- **request:** O objeto de requisição que contém os dados enviados pelo cliente, tais como `body`, `query`, `pathname`, `action`, `headers`, `cookies`, `params` e `state`. Esses dados são fundamentais para que o middleware possa tomar decisões informadas.  
- **response:** O objeto de resposta que permite modificar a saída, seja através de redirecionamentos ou de respostas específicas, como mensagens de erro. No Igniter, o `response` está integrado com os mecanismos de roteamento do NextJS, permitindo redirecionamentos nativos sem configurações adicionais.  
- **middleware:** Este objeto inclui o `name` e as `options` configuradas para o middleware, possibilitando o acesso às configurações e ajustes necessários para a execução do fluxo de validação ou autenticação.

Cada uma dessas propriedades facilita a criação de middlewares poderosos e customizáveis.

---

## 3. Exemplos de Uso e Cenários Práticos

Esta seção apresenta exemplos práticos que demonstram como implementar middlewares no Igniter Framework, desde os casos mais simples até integrações avançadas com o NextAuth.

### 3.1 Middleware Simples: Logging

Nesta subseção, exemplificamos um middleware simples que faz o registro (log) das requisições recebidas. Esse middleware registra informações como o método e a URL da requisição, sem interferir no fluxo da execução.

```typescript
import type { IgniterMiddleware, IgniterMiddlewareContext } from "@igniter/modules";

/**
 * Middleware para registro de requisições.
 * Este middleware intercepta a requisição para logar o método e a URL,
 * permitindo que a execução continue normalmente.
 */
export function LogMiddleware(): IgniterMiddleware {
  return {
    name: 'log',
    options: {},
    execute: async (ctx: IgniterMiddlewareContext) => {
      console.log(`Método: ${ctx.request.action} - URL: ${ctx.request.url}`);
      // Retorna um objeto vazio, permitindo que o fluxo continue.
      return {};
    }
  }
}
```

*Introdução ao Exemplo:*  
Neste exemplo, o middleware "LogMiddleware" demonstra como é possível interceptar e registrar informações da requisição para fins de monitoramento e depuração, sem modificar ou interromper o fluxo da requisição.

---

### 3.2 Middleware para Autenticação com NextAuth

Esta subseção apresenta um exemplo avançado de middleware que utiliza o NextAuth para gerenciar a autenticação do usuário. O exemplo cobre desde a instalação e configuração do NextAuth até a utilização de redirecionamentos e tratamento de erros.

#### Configuração Inicial (Exemplo Traduzido)

Antes de utilizar, é necessário configurar o NextAuth. Embora as instruções de instalação e configuração estejam em inglês, elas devem ser seguidas conforme a documentação oficial. Abaixo, um resumo em português:

1. Instale o pacote NextAuth:
   ```bash
   npm install next-auth@beta
   ```

2. Gere o segredo de autenticação:
   ```bash
   npx auth secret
   ```
   Este segredo é usado para criptografar tokens e hashes de verificação.

3. Configure o NextAuth criando um arquivo, por exemplo, `auth.ts`, onde você define os providers, callbacks, adaptadores, etc.

#### Exemplo de Middleware com NextAuth
Neste exemplo, o middleware "NextAuthMiddleware" valida a sessão utilizando o NextAuth. Se a sessão não for válida, ele redireciona o usuário ou retorna respostas de erro predefinidas. O exemplo mostra como configurar as opções do middleware e como o objeto `response` é utilizado para invocar os redirecionamentos de forma nativa no NextJS.

```typescript
import { AppConfig } from "@/configs/app.config";
import { AuthError } from "@/providers/auth/errors";
import type { IgniterMiddleware, IgniterMiddlewareContext } from "@igniter/modules";
import type { AppRouterState } from "@/igniter.router";

/**
 * Opções para o Middleware de Autenticação.
 * Permite configurar requisitos e permissões para as rotas protegidas.
 */
export type AuthMiddlewareOptions = {
  roles: ['admin, user']
}

/**
 * Tipagem para o contexto do Middleware de Autenticação.
 */
export type AuthMiddlewareContext = IgniterMiddlewareContext<
  AppRouterState, 
  AuthMiddlewareOptions
>

/**
 * Middleware para integração com NextAuth.
 * Este middleware utiliza o NextAuth para validar a sessão do usuário.
 * Se a sessão for inválida, redireciona o usuário ou retorna respostas apropriadas.
 */
export function AuthMiddleware(options: AuthMiddlewareOptions): IgniterMiddleware<AppRouterState, AuthMiddlewareOptions> {
  return {
    name: 'next-auth',
    options: options,
    execute: async (ctx: AuthMiddlewareContext) => {
      // Busca a sessão usando o Next-Auth
      const session = await auth()

      // Armazena o usuário para ser usado abaixo
      const userSession = session?.user

      // Verifica se é uma pagina da dashboard
      const isDashboardPath = ctx.request.pathname.startsAt('/app')

      // Se a sessão for invalida, redireciona o user para a pagina /auth
      if (isDashboardPath && !userSession) {
        // Você tambêm pode usar o `forbidden`:
        return ctx.response.redirect('/auth');

        // Você tambêm pode usar o `unauthorized`:
        // return ctx.response.unauthorized()
      }

      // Verifica se a rota depende de ser um admin
      const isAdminPath = ctx.request.pathname.startsAt('/app/admin')

      // Se a `role` do user for diferente de admin, deve redirecionar para o /app
      if (isAdminPath && !ctx.middleware.options.roles.includes(userSession.role)) {
        return ctx.response.redirect('/app');

        // Você tambêm pode usar o `forbidden`:
        // return ctx.response.forbidden()
      }

      // Se a sessão for valida, permite prosseguir e passa a sessão pelo state do IgniterRequest
      return {
        session,
      };
    }
  }
}
```

---

## 4. Integração dos Middlewares em um Controller

Para finalizar a documentação dos Middlewares, é importante demonstrar como estes se integram em um Controller no Igniter. Essa seção mostra um exemplo prático de como um Controller utiliza um middleware para proteger uma rota e como o contexto modificado pelo middleware é disponibilizado para o Controller.

Neste exemplo, o Controller utiliza o middleware de autenticação com NextAuth para proteger a rota de atualização de usuário. O middleware intercepta a requisição, valida a sessão e, se tudo estiver correto, permite o fluxo para que o Controller invoque o Service. Essa integração demonstra como os middlewares do IgniterJS facilitam a proteção das rotas e a gestão dos fluxos de autenticação.

```typescript
import { Controller, IgniterController, type IgniterContext } from "@igniter/modules";
import { UserService } from "../services/user.service";
import { NextAuthMiddleware } from "@/core/middlewares/next-auth.middleware";
import { UserValidator } from "../validators/user.validator";

import type { UserDTOs } from "../user.types";

export class UserController extends IgniterController {
  public name = 'user' as const;

  constructor(private readonly service: UserService) {
    super();
  }

  @Controller({
    name: 'update',
    schema: UserValidator.get('update'),
    middlewares: [ NextAuthMiddleware({ roles: ['admin', 'user'] })]
  })
  public async update(ctx: IgniterContext<UserDTOs['update']>) {
    // Caso o middleware tenha validado com sucesso, a sessão estará disponível no contexto
    const user = await this.service.update(ctx.request);
    
    return ctx.response.status(200).json(user);
  }
}
```

---

## 5. Conclusão

O uso dos Middlewares no IgniterJS ressalta a importância de uma camada de interceptação bem definida para a validação, autenticação e autorização das requisições. Ao utilizar middlewares, os desenvolvedores podem centralizar a lógica de segurança e melhorar a modularidade do sistema. A integração perfeita com o NextJS – através do objeto `response` e redirecionamentos nativos – oferece uma experiência consistente e segura para os usuários.