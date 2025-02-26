# Introdução à Estrutura de Features no Igniter Framework

Bem-vindo à documentação oficial sobre a estrutura de uma feature no Igniter Framework. Este guia foi criado para ajudar desenvolvedores a compreender e seguir os padrões estabelecidos para implementar novas features no projeto.

No Igniter, uma feature é um conjunto coeso de módulos que encapsula uma funcionalidade específica. Tipicamente, ela é composta por:
- **Controllers:** Gerenciam as requisições HTTP, validam entradas e invocam os serviços correspondentes.
- **Services:** Contêm as regras de negócio e interagem com os repositórios ou providers.
- **Repositories:** Responsáveis pelo acesso e persistência de dados, geralmente utilizando ORM (ex.: Prisma).
- **Validators:** Definem os schemas de validação utilizando o `ZodValidator`, garantindo a integridade dos dados recebidos.
- **Tipos e Configurações:** Organizados em arquivos dedicados (ex.: `api-key.types.ts`, `api-key.feature.ts`) para definir e agrupar os tipos de dados, configurações e integrações da feature.
- **Ponto de Entrada:** O arquivo `index.ts`, que agrega e exporta os principais componentes da feature.

Este documento é o primeiro de uma série que detalha cada um desses componentes, oferecendo exemplos práticos e diretrizes de boas práticas.
