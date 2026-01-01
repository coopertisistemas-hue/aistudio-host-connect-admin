# Manual de Inicialização do Hotel 🏨

Este documento serve como guia oficial para a configuração inicial de propriedades no sistema HostConnect. Após o onboarding, siga estes passos para garantir que o hotel esteja pronto para receber reservas.

---

## 1. Configuração de Tipos de Quarto (Room Types)

O sistema criou suas unidades (ex: 44 quartos), mas elas ainda são "genéricas". Precisamos dizer ao sistema quais são Standard, Luxo, etc.
/
**Por que isso é importante?**
O hóspede não compra o "Quarto 101", ele compra uma "Categoria Standard". O preço e a disponibilidade são controlados por Categoria.

### Passo a Passo:
1.  No menu lateral, clique em **Configurações > Tipos de Quarto** (`/room-types`).
2.  Clique no botão **+ Novo Tipo de Quarto**.
3.  Preencha os dados:
    *   **Nome**: Ex: "Suíte Luxo com Varanda".
    *   **Descrição**: Texto que vai aparecer no site/motor de reservas. Capriche!
    *   **Capacidade Base**: Quantas pessoas o preço padrão cobre (ex: 2).
    *   **Capacidade Máxima**: Quantas pessoas cabem no total (ex: 3, se houver cama extra).
    *   **Tamanho (m²)**: Importante para comparação de valor.
4.  **Aba "Vincular Unidades" (IMPORTANTE)**:
    *   Você verá a lista de todos os seus quartos (Urubici Park Hotel - Unidade 1, etc.).
    *   Marque as caixas de seleção (checkbox) de todos os quartos que pertencem a esta categoria.
    *   *Exemplo:* Se os quartos 101 a 120 são Standard, marque todos eles aqui.
5.  Clique em **Salvar**.

> [!TIP]
> Repita esse processo para todas as categorias (Standard, Luxo, Master, etc.) até que todos os 44 quartos estejam vinculados a algum tipo.

---

## 2. Cadastro de Comodidades (Amenities)

Informe o que seu hotel e seus quartos oferecem. Isso aumenta a conversão de vendas.

### Passo a Passo:
1.  Vá para **Propriedades > Comodidades** (`/amenities`).
2.  **Comodidades da Propriedade** (Geral):
    *   Clique em "Adicionar".
    *   Selecione itens como: *Wi-Fi Grátis, Estacionamento, Piscina, Recepção 24h*.
3.  **Comodidades do Quarto** (Específico):
    *   Estas devem ser vinculadas aos "Tipos de Quarto" criados no passo anterior.
    *   Edite um "Tipo de Quarto" e vá na aba "Comodidades".
    *   Marque itens como: *Ar Condicionado, TV Smart 50", Frigobar, Secador de Cabelo*.

---

## 3. Gestão de Fotos

Fotos profissionais são o fator #1 de decisão de compra.

### Passo a Passo:
1.  Vá para **Propriedades > Fotos**.
2.  **Fotos do Hotel (Fachada/Áreas Comuns)**:
    *   Faça o upload de fotos da piscina, recepção, café da manhã e fachada.
    *   Defina uma foto como "Principal" (será a capa do site).
3.  **Fotos dos Quartos**:
    *   Em vez de colocar fotos na propriedade geral, vá em **Configurações > Tipos de Quarto**.
    *   Edite cada categoria (ex: Luxo) e faça upload das fotos específicas daquele quarto.
    *   *Isso evita que o cliente veja foto de banheira comprando um quarto Standard.*

---

## 4. Tarifário e Regras de Preço

Sem preço, não há venda. Configure sua tabela.

### Passo a Passo:
1.  Vá para **Financeiro > Regras de Preço** (`/pricing-rules`).
2.  **Tarifa Base**:
    *   Crie uma regra chamada "Tarifa Padrão".
    *   Defina o valor base para cada Tipo de Quarto (ex: Standard = R$ 250, Luxo = R$ 400).
    *   Aplique para "Todos os dias" ou "Dias de semana".
3.  **Sazonalidade (Alta Temporada/Feriados)**:
    *   Crie uma nova regra ex: "Natal e Ano Novo".
    *   Selecione o período (ex: 20/Dez a 05/Jan).
    *   Defina o preço diferenciado ou um percentual de aumento (+50%).
4.  **Verificação**:
    *   Vá em **Reservas > Calendário** e verifique se os preços aparecem nos dias corretos.

---

## 5. Cadastro de Equipe (Team)

Adicione seus recepcionistas, gerentes e staff para acessarem o sistema.

### Tipos de Acesso:
*   **Admin**: Acesso total (incluindo financeiro e configurações).
*   **Gerente**: Acesso operacional completo + relatórios (sem configurações sensíveis).
*   **Staff**: Recepção, Reservas (operacional básico).
*   **Visualizador**: Apenas visualização (ex: investidores).

### Passo a Passo:
1.  Vá para **Configurações > Equipe** ou **Team Management** (ícone de usuários).
2.  **Convidar Novo Usuário**:
    *   Digite o e-mail do colaborador.
    *   Selecione a função (Role).
    *   Clique em **Gerar Convite**.
3.  **Compartilhar Link**:
    *   O sistema gerará um link de convite único.
    *   Copie esse link e envie para a pessoa via WhatsApp ou E-mail.
    *   Quando ela clicar, poderá criar a própria senha e acessar a organização.

> [!WARNING]
> O link de convite é pessoal e intransferível. Cada funcionário deve ter seu próprio login para fins de auditoria (saber quem fez o quê).

---

## 6. Controle de Inventário (Novo) 📦

Gerencie os itens físicos de cada acomodação (ex: Frigobar, Toalhas, Cama).

### Passo a Passo:
1.  **Criar o Catálogo**:
    *   Vá em **Configuração de Unidades > Inventário de Acomodação**.
    *   Clique em **novo Item** e cadastre tudo que pode ter num quarto: "Toalha de Banho", "Travesseiro", "Cofre".
2.  **Vincular ao Quarto**:
    *   Vá em **Tipos de Acomodação**.
    *   Edite um tipo (ex: Suíte Master).
    *   Clique na aba **Inventário**.
    *   Adicione os itens e quantidades (ex: 4 Travesseiros, 2 Toalhas de Banho).

> [!NOTE]
> Essa configuração será usada futuramente para checklists de governança e conferência de quarto (Check-out).

---

## 7. Serviços Extras e Taxas (Services) 🛎️

Enquanto "Comodidades" são coisas que o hotel *tem* (piscina, wifi), "Serviços" são coisas que o hóspede *paga* ou *contrata*.

**Exemplos de Serviços:**
*   Café da Manhã (R$ 35,00 / pessoa)
*   Estacionamento (R$ 20,00 / dia)
*   Carregador Veicular (R$ 50,00 / uso)
*   Aluguel de Auditório

### Passo a Passo:
1.  Vá em **Configuração de Unidades > Serviços** (`/services`).
2.  Clique em **Novo Serviço**.
3.  Defina o nome e o preço.
4.  Configure as regras de cobrança:
    *   **Por Pessoa?** (Marque se o valor multiplica pelo nº de hóspedes).
    *   **Por Dia?** (Marque se é uma diária, como estacionamento).

> [!TIP]
> Esses serviços aparecerão como opcionais na hora da reserva ou poderão ser lançados na conta do hóspede durante a estadia.

---

## 8. Mini-Ecommerce e Consumo (PDV) 🛒

Venda itens da recepção ou lance o consumo do frigobar direto na conta do hóspede.

### 1. Configurar Produtos
1.  Vá em **Inventário**.
2.  Ao criar um item (ex: Coca-Cola), marque **"Item Disponível para Venda"**.
3.  Defina o **Preço** (ex: R$ 6,00).

### 2. Realizar Venda (Checkout)
1.  Acesse **Operacional > Compra Rápida (PDV)**.
2.  Clique nos produtos para adicionar ao carrinho.
3.  Selecione o **Quarto/Hóspede** que está comprando.
4.  Clique em **Confirmar Venda**.

> [!NOTE]
> O valor será adicionado aos "Extratos/Despesas" da reserva e o estoque será abatido automaticamente da Copa.

---

## 9. Checklist Final ✅

Antes de "abrir as portas":
- [ ] Todos os 44 quartos estão vinculados a um Tipo de Quarto?
- [ ] As comodidades principais (Wi-Fi, Café) estão cadastradas?
- [ ] Cada tipo de quarto tem pelo menos 3 fotos?
- [ ] O calendário mostra preços para os próximos 6 meses?
- [ ] A equipe da recepção foi cadastrada e recebeu seus acessos?
- [ ] O inventário padrão de cada quarto (toalhas, equipamentos) foi definido?

Se marcou tudo, sua propriedade está pronta para operar! 🚀
