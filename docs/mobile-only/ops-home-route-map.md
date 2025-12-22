# Ops Home Route Map (/m)
Inventory of all clickable elements and their navigation contracts.

## Header Actions (MobileTopHeader)
| Element | Icon | Logic / Destination | Description |
| :--- | :--- | :--- | :--- |
| **Refresh** | `RotateCw` | `window.location.reload()` | Triggers manual page reload with 800ms cooldown. |
| **Logout** | `LogOut` | `signOut()` -> `/auth` | Terminates session and redirects to login. |

## Quick Access Section (Acesso Rápido)
| Label | Subtitle | Icon | Destination |
| :--- | :--- | :--- | :--- |
| **Pedidos Agora** | Fila de produção em tempo real | `Package` | `/m/ops-now` |
| **Novo Pedido** | Lançar pedido de balcão/mesa | `PlusCircle` | `/m/new-order` |
| **Pagamentos** | Confirmar Pix e caixa | `DollarSign` | `/m/payments` |
| **Controle de Caixa** | Reforços, sangrias e saldo | `Wallet` | `/m/cash-control` |
| **Cardápio** | Pausar/Ativar produtos | `BookOpen` | `/m/menu` |
| **Status Loja** | Abrir ou fechar operação | `Store` | `/m/status` |
| **Resumo** | Métricas do dia até agora | `BarChart3` | `/m/summary` |

## Guardrails
- **DO NOT CHANGE ROUTES**: The routes above are the official navigation contract for the mobile operations pilot.
- **DO NOT CHANGE HANDLERS**: The logic for refresh and logout must be preserved to ensure operational stability.
