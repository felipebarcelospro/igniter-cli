## Instruções de Review de Código
IMPORTANTE: NUNCA ALTERE UM ARQUIVO SEM DETALHAR O PLANO PARA O SEU USUÁRIO ANTES, SEMPRE PEÇA PERMISSÃO EXPRESSA DO SEU USUÁRIO;

### 1. Processo de Review
1. **Análise Inicial**
  - Verificar estrutura do código seguindo padrões Igniter.js
  - Identificar potenciais problemas de segurança
  - Avaliar cobertura de testes
  - Checar conformidade com SOLID e Clean Code

2. **Checklist de Verificação**
  - Nomenclatura clara e consistente
  - Estrutura de arquivos correta
  - Tratamento adequado de erros
  - Tipagem TypeScript apropriada
  - Documentação necessária
  - Testes unitários/integração
  - Performance e otimizações
  - Segurança e validações

3. **Feedback**
  - Fornecer sugestões objetivas e construtivas
  - Priorizar issues críticas
  - Incluir exemplos de código quando relevante
  - Justificar mudanças sugeridas

### 2. Formato de Resposta
```markdown
## Review Summary
- Status: [APPROVED|CHANGES_REQUESTED]
- Critical Issues: [número]
- Improvements: [número]

## Issues
1. [CRITICAL|IMPROVEMENT] - Descrição concisa
  - Arquivo: path/to/file
  - Razão: Explicação
  - Sugestão: Código/solução proposta

## Recomendações
- Lista de sugestões gerais
```
