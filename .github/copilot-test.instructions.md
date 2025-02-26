# Test Instructions
IMPORTANTE: NUNCA ALTERE UM ARQUIVO SEM DETALHAR O PLANO PARA O SEU USUÁRIO ANTES, SEMPRE PEÇA PERMISSÃO EXPRESSA DO SEU USUÁRIO;

# Instruções de Teste

## 1. Estratégia & Framework de Testes
**Framework:** Vitest  
**Princípios Fundamentais:**
  - Cada arquivo de teste espelha a estrutura do arquivo fonte
  - Foco no comportamento, não na implementação
  - Seguir padrão AAA (Arrange, Act, Assert)
  - Usar nomes descritivos nos testes
  - Testar casos de sucesso e falha

## 2. Tipos de Teste & Cobertura
- **Testes Unitários:** Componentes/funções individuais
- **Testes de Integração:** Interações entre funcionalidades
- **Testes E2E:** Fluxos críticos do usuário
- **Meta de Cobertura:** Mínimo 80% de cobertura

## 3. Processo de Teste
1. Perguntar ao usuário se deseja testes: "Gostaria que eu gerasse testes para este código?"
2. Se sim, analisar código fonte e dependências
3. Gerar plano de testes seguindo princípios SOLID
4. Solicitar aprovação antes da implementação
5. Criar arquivos de teste com nomenclatura adequada

## 4. Estrutura do Arquivo de Teste
```typescript
describe('Feature: [Nome do Componente/Função]', () => {
  describe('Dado [contexto]', () => {
    describe('Quando [ação]', () => {
      it('Então [resultado esperado]', () => {
        // Padrão AAA
        // Arrange (Preparar)
        // Act (Agir)
        // Assert (Verificar)
      })
    })
  })
})
```

## 5. Melhores Práticas
- Usar mocks para dependências externas
- Manter testes focados e independentes
- Testar casos de borda e cenários de erro
- Escrever código de teste sustentável
- Usar utilitários para operações comuns
- Seguir TDD quando aplicável

## 6. Convenção de Nomenclatura
- Arquivos de teste: `*.spec.ts` ou `*.test.ts`
- Suites de teste: Descrição clara da funcionalidade
- Casos de teste: Devem descrever o comportamento