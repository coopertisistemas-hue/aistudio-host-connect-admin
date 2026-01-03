# Decision Log — HostConnect

## 2026-01-03 — Posicionamento do produto
Decisão: Posicionar HostConnect como "Studio Operacional", não como "motor de reservas".
Motivo: Diferenciação premium e foco em valor operacional.
Impacto: Marketing, pricing, roadmap e UX.

## 2026-01-03 — Inicialização Encadeada (Race Condition Fix)
Decisão: Implementar obrigatoriedade de carregamento serial (Auth -> Org -> Properties -> SelectedProperty).
Motivo: Corrigir falha onde propriedades sumiam no F5 devido ao carregamento assíncrono antes da validade da sessão.
Impacto: Estabilidade garantida no Refresh; Pequeno delay percebido (Skeleton) compensado pela integridade dos dados.

## 2026-01-05 — Público foco inicial
Decisão: Priorizar pousadas e retiros cristãos na Fase 2.
Motivo: Nicho com dor clara e baixa concorrência.
Impacto: Módulo de grupos ganha prioridade.
