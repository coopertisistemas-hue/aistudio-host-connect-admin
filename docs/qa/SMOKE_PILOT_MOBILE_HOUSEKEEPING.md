# Checklist de Smoke Test — Mobile Housekeeping

1) Objetivo: confirmar seleção da propriedade
   - Passos: abrir o filtro de propriedade e selecionar outra opção.
   - Resultado esperado: a lista atualiza e a seleção persiste ao voltar para a tela.

2) Objetivo: validar estados de carregamento
   - Passos: abrir a tela e observar loading/empty/error quando aplicável.
   - Resultado esperado: aparece loading; em vazio mostra mensagem adequada; erro mostra mensagem genérica.

3) Objetivo: verificar busca, filtros e contadores
   - Passos: usar busca e alternar chips de status.
   - Resultado esperado: lista, contadores e “Exibindo: X quartos” ficam consistentes.

4) Objetivo: fluxo de status individual
   - Passos: em um quarto pendente, avançar para em limpeza e depois limpo.
   - Resultado esperado: status atualiza com feedback e sem travar a tela.

5) Objetivo: gating do checklist antes de revisão
   - Passos: tentar marcar como em revisão sem concluir o checklist.
   - Resultado esperado: ação bloqueada com mensagem de orientação.

6) Objetivo: reset do checklist
   - Passos: trocar de quarto ou mudar status para fora de limpeza/limpo.
   - Resultado esperado: checklist volta ao estado inicial.

7) Objetivo: manutenção com validação
   - Passos: abrir “Reportar manutenção”, testar prioridade alta sem descrição.
   - Resultado esperado: erro inline e toast; em falha mantém texto.

8) Objetivo: observações sem persistência
   - Passos: abrir “Adicionar observação”.
   - Resultado esperado: salvar desabilitado e texto “Funcionalidade em breve.”

9) Objetivo: modo seleção e aplicação em lote
   - Passos: ativar modo seleção, escolher quartos, aplicar ação e cancelar.
   - Resultado esperado: barra mostra progresso, cancelamento interrompe pendentes e exibe resumo.

10) Objetivo: dica de auditoria e histórico
   - Passos: verificar “Atualizado há … · por …” e “Ver histórico”.
   - Resultado esperado: sem PII; histórico só para perfis permitidos.
