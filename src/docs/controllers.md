# Documentação dos Controllers no Igniter Framework

Este documento descreve a estrutura e as boas práticas para a implementação de controllers em uma feature no Igniter Framework, utilizando como exemplo uma feature de **User** básica.

---

## 1. Visão Geral

Os **controllers** são responsáveis por gerenciar as requisições HTTP, validar os dados de entrada (através dos Validators) e invocar os métodos dos Services para aplicar as regras de negócio. Eles operam como a camada de interface entre o cliente e a lógica de negócio.

---

## 2. Localização e Organização

- **Localização Padrão:**  
  Os controllers devem residir em `src/features/<feature>/controllers/`.  
  Por exemplo, para a feature **User**, os controllers devem estar em `src/features/user/controllers/`.

- **Nomenclatura:**  
  Deve-se utilizar nomes claros e diretos, como `UserController.ts`, em que o nome reflete a funcionalidade do controller.

---

## 3. Estrutura de um Controller

Cada controller deve:
- Herdar de `IgniterController` para se integrar com o framework.
- Definir um `name` que será usado para as rotas e identificação da feature.
- Receber os serviços via injeção de dependência para delegar a execução das regras de negócio.
- Utilizar decorators para mapear as rotas das requisições e aplicar middlewares para controle de acesso e validação de dados.

### Exemplo Simples

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
    // Middleware simples para verificação, se necessário.
  })
  public async create(ctx: IgniterContext<UserDTOs['create']>) {
    // Business Rule: Cria um novo usuário
    const user = await this.service.create(ctx.request);
    return ctx.response.status(201).json(user);
  }

  // Métodos para "get", "update", "delete", etc., seguindo o mesmo padrão.
}
```

### Exemplo com NextAuth Middleware

Em algumas situações, pode ser necessário utilizar middlewares mais robustos, por exemplo, para autenticação via NextAuth. Veja como aplicar:

```typescript
import { Controller, IgniterController, type IgniterContext } from "@igniter/modules";
import { UserService } from "../services/user.service";
import { NextAuthMiddleware } from "@/middlewares/next-auth.middleware";
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
    middlewares: [
      // Exemplo de middleware simples
      // NextAuthMiddleware é utilizado para proteger a rota com autenticação NextAuth.
      NextAuthMiddleware({ strategy: 'jwt' })
    ],
  })
  public async update(ctx: IgniterContext<UserDTOs['update']>) {
    // Business Rule: Atualiza os dados do usuário
    const user = await this.service.update(ctx.request);
    return ctx.response.status(200).json(user);
  }
}
```

---

## 4. Boas Práticas

- **Validação de Dados:**  
  Sempre utilize um Validator (como `UserValidator`) para garantir que a entrada esteja conforme esperado.

- **Comentários de Business Rules:**  
  Documente as regras de negócio diretamente nos métodos, mas evite comentários excessivos que poluam o código.

- **Uso de Middlewares:**  
  Aplique middlewares para controle de acesso, autenticação ou qualquer outra verificação prévia. Documente claramente o propósito de cada middleware utilizado.

- **Consistência:**  
  Mantenha uma estrutura consistente em todos os controllers, facilitando a manutenção e a escalabilidade do código.

---

## 5. Conclusão

Os controllers são peças fundamentais na organização da feature, servindo de ponte entre as requisições do cliente e a lógica de negócio encapsulada nos Services. Seguindo estes padrões, é possível criar controllers robustos, seguros e fáceis de manter.

Para mais detalhes sobre outros componentes, consulte os documentos:
- [Services](./services.md)
- [Validators](./validators.md)
- [Repositories](./repositories.md)
- [Middlewares](./middlewares.md)
- [Router](./router.md)
