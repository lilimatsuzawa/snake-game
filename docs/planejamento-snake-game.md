# Planejamento de Implementação — Snake Game (Jogo da Cobrinha)

## Objetivo
Construir um protótipo funcional (MVP) de Snake Game clássico para web (HTML + CSS + JavaScript) jogável em computador desktop, com controles por teclado, placar, níveis de velocidade e possibilidade de reiniciar.

## Escopo (o que o jogo deve ter)
- **Tabuleiro em grade** (grid) com tamanho configurável.
- **Cobra** que se move continuamente em uma direção.
- **Comida** gerada aleatoriamente em células livres.
- **Crescimento** da cobra ao comer.
- **Colisões** com paredes (ou modo “wrap”, se desejar) e com o próprio corpo.
- **Game Over** e **reinício**.
- **Placar** (score) e, opcionalmente, **recorde** persistido no navegador.
- **Níveis/dificuldade** via velocidade progressiva.
- **Desktop-first**: sem necessidade de suporte a mobile neste protótipo.

---

## Fase 1 — Preparação do projeto e arquitetura

### 1.1 — Definir estrutura de pastas e arquivos
- **Criar** a estrutura mínima do projeto (exemplo):
  - `index.html`
  - `src/` (ou `assets/`)
    - `main.js`
    - `styles.css`
- **Definir** se será projeto “vanilla” (sem framework) e sem build step.

### 1.2 — Definir especificações do jogo (configuração)
- **Configurar constantes**:
  - Tamanho da grade (ex.: 20x20)
  - Tamanho visual da célula (ex.: 20px)
  - Velocidade inicial (ms por tick)
  - Incremento de velocidade por ponto/nível
- **Decidir regras**:
  - Colidir na parede = Game Over (clássico) ou wrap (opcional)
  - Permitir ou bloquear reversão imediata (recomendado bloquear)

### 1.3 — Planejar o modelo de dados
- Representar posições como `{ x, y }` (inteiros).
- Cobra como array de posições:
  - `snake[0]` = cabeça
  - `snake[snake.length - 1]` = cauda
- Direção atual como vetor:
  - `dir = { x: 1, y: 0 }` (direita)
- Comida como uma posição `{ x, y }`.
- Estado do jogo:
  - `running`, `paused`, `gameOver`
  - `score`, `level`, `speed`

### 1.4 — Planejar funções/módulos principais
- **Engine/Loop**: controla ticks e timing.
- **Input**: captura teclado e atualiza direção.
- **Update**: aplica regras (mover, comer, colidir).
- **Render**: desenha tabuleiro/cobra/comida.
- **UI**: score, botões (iniciar/pausar/reiniciar), mensagens.

---

## Fase 2 — UI básica e renderização do tabuleiro

### 2.1 — Implementar `index.html` com layout
- Área do jogo:
  - Usar `<canvas>`.
- Painel de informações:
  - Score
  - Level
  - High score (opcional)
- Controles:
  - Botão “Iniciar/Reiniciar”
  - Botão “Pausar/Continuar”

### 2.2 — Implementar estilos em `styles.css`
- Centralizar o jogo e tornar responsivo.
- Definir tema (cores de fundo, cobra, comida).
- Garantir boa legibilidade do placar.

### 2.3 — Implementar renderização do grid
- Definir dimensões do canvas a partir do grid:
  - `canvas.width = cols * cellSize`
  - `canvas.height = rows * cellSize`
- Desenhar retângulos por célula (cobra e comida).
- A cada tick, limpar e redesenhar.

### 2.4 — Criar helpers de render
- Função para desenhar um “tile” `{x,y}` no canvas.
- Função para limpar o canvas.
- Função para renderizar cobra (corpo + cabeça) e comida.

---

## Fase 3 — Lógica do jogo (movimento, comida, colisões)

### 3.1 — Inicialização do estado
- Posição inicial da cobra (ex.: 3 segmentos no centro).
- Direção inicial (ex.: direita).
- Score = 0, Level = 1, Speed = inicial.
- Gerar a primeira comida.

### 3.2 — Controle de input
- Mapear setas do teclado e/ou WASD.
- Implementar regra de **não permitir reversão** imediata:
  - Ex.: se está indo para direita, não aceitar esquerda.
- Guardar a “próxima direção” para aplicar no tick (evita múltiplas leituras por frame).
- Definir regra de **buffer de input por tick**:
  - Aceitar várias teclas entre ticks, mas aplicar apenas a **última direção válida** no próximo tick.
  - Após consumir a direção no tick atual, só permitir nova atualização do buffer para o tick seguinte.
- Prevenir scroll da página ao jogar com setas (capturar evento e evitar o comportamento padrão enquanto o jogo estiver ativo).

### 3.3 — Loop do jogo (tick)
- Criar um timer (`setInterval`) ou loop com `requestAnimationFrame` + controle de delta.
- Em cada tick:
  - Aplicar `nextDir` → `dir`
  - Calcular nova cabeça: `newHead = head + dir`
  - Checar colisões
  - Checar comida
  - Atualizar array da cobra
  - Atualizar score/nível/velocidade (se comeu)
  - Renderizar

### 3.4 — Regras de colisão
- **Parede**:
  - Se `newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows` → Game Over.
- **Auto-colisão**:
  - Se `newHead` está em qualquer segmento existente → Game Over.
  - Regra importante: se **não houver crescimento** naquele tick, a cauda será removida; então é permitido `newHead` ser igual à posição atual da cauda (evita falso positivo e deixa o jogo mais consistente).

### 3.5 — Comer comida e crescer
- Se `newHead` == `food`:
  - Incrementar score
  - Não remover cauda (cresce)
  - Gerar nova comida em célula vazia
  - Ajustar velocidade/nível (se aplicável)
- Caso contrário:
  - Remover último segmento (movimento normal)

### 3.6 — Geração de comida segura
- Gerar comida escolhendo aleatoriamente entre **células livres**:
  - Construir uma lista de todas as posições do grid.
  - Remover da lista as posições ocupadas pela cobra.
  - Selecionar 1 posição aleatória das restantes.
- Se não existirem células livres, o jogador venceu (ver próxima etapa).

### 3.7 — Condição de vitória (protótipo)
- Se `snake.length === cols * rows`, exibir mensagem de vitória e parar o loop.

---

## Fase 4 — Estados do jogo, UX e polimento

### 4.1 — Pausar/Continuar
- Tecla (ex.: `Space`) e botão.
- Pausa deve interromper ticks e manter render.
- Auto-pausar ao perder foco/visibilidade (desktop):
  - Ao minimizar a aba/janela ou trocar de aplicativo (`visibilitychange`/`blur`).

### 4.2 — Game Over e reinício
- Exibir overlay/mensagem “Game Over”.
- Botão “Reiniciar”:
  - Resetar estado
  - Resetar velocidade/nível
  - Recomeçar loop

### 4.3 — Recorde (High Score) persistido
- Usar `localStorage`:
  - Ler ao iniciar
  - Atualizar quando `score > highScore`

### 4.4 — Dificuldade/níveis (velocidade progressiva)
- Estratégias:
  - A cada X pontos, aumentar `level` e reduzir `intervalMs`.
- Atualizar o loop ao mudar a velocidade (se usar `setInterval`, reiniciar o intervalo).
- Definir limites do protótipo:
  - `intervalMsInicial` (ex.: 140ms)
  - `intervalMsMinimo` (ex.: 70ms)
  - A cada 5 pontos: `intervalMs = max(intervalMsMinimo, intervalMs - 10)`.

### 4.5 — Acessibilidade e responsividade
- Garantir foco e uso por teclado.
- Informar controles na UI.
- Ajustar o layout para desktop (evitar scroll acidental, tamanhos legíveis).

---

## Fase 5 — Qualidade, testes manuais e validações

### 5.1 — Checklist de testes manuais
- Movimento contínuo em todas as direções.
- Bloqueio de reversão.
- Buffer de input por tick (mudanças rápidas não geram comportamento “duplo” no mesmo tick).
- Comer comida sempre cresce e aumenta score.
- Comida nunca nasce dentro da cobra.
- Colisão com parede → Game Over.
- Colisão com corpo → Game Over.
- Vitória ao preencher a grade (sem células livres para comida).
- Pausar/continuar funciona sem “pular” inputs.
- Auto-pausa ao perder foco/visibilidade.
- Reiniciar volta ao estado inicial.
- High score persiste ao recarregar.

### 5.2 — Validar casos extremos
- Cobra muito grande (performance de render).
- Mudança rápida de direção (debounce por tick).
- Velocidade muito alta (limitar mínimo de `intervalMs`).

---

## Fase 6 — Organização final e entrega

### 6.1 — Refatoração leve (sem mudar comportamento)
- Separar responsabilidades (por exemplo):
  - `state.js` (estado e reset)
  - `engine.js` (loop)
  - `input.js` (teclado)
  - `render.js` (desenho)
- Manter imports simples (ou tudo em um arquivo, se preferir, mas organizado por seções).

### 6.2 — Preparar para publicação
- Garantir caminhos relativos corretos.
- Testar abrindo `index.html` diretamente e via servidor local.

### 6.3 — (Opcional) Melhorias futuras
- Modos:
  - Wrap (atravessa paredes)
  - Obstáculos
  - Skins/temas
- Animações e efeitos sonoros.
- Controles mobile (swipe).

---

## Critérios de aceite (Definition of Done)
- O jogo inicia, roda e é jogável do início ao fim.
- Regras básicas do Snake estão corretas (movimento, comida, colisão, crescimento).
- UI mostra score e permite reiniciar.
- Protótipo está sólido em desktop (teclado), sem necessidade de suporte mobile.
- Código está legível e organizado.
