# Fase 5C.2A.2 — usabilidade mobile

Implementação limitada à câmera, apresentação/alvos dos handles e layout/scroll
do personalizador. Sem alterações no store, nas fórmulas de transformação,
no wrap 360°, na inserção visível ou em recursos comerciais. Sem commit.

## Câmera e handles

- Configuração central: `src/components/personalizer/3d/personalizer3dConfig.ts`.
- Mobile/tablet até 1023 px: distância mínima de câmera **5,2 → 2,6**.
- Desktop a partir de 1024 px: distância mínima **5,2**, preservada.
- Distância máxima **8,5**, câmera inicial, FOV, plano próximo e limites polares
  preservados. A aproximação máxima é um close para editar detalhes; a peça pode
  ultrapassar o enquadramento, sem a câmera entrar no modelo.
- Revisão geométrica amostra todo o azimute e intervalo polar permitido para
  verificar afastamento entre câmera/plano próximo e a caixa que contém a caneca,
  incluindo alça. OrbitControls aplica ambos os limites de distância.
- No mobile, cantos e laterais são quadrados de **18 × 18 CSS px**; rotação tem
  **22 px de diâmetro**. O contorno de 2 px aumenta o tamanho externo para 20/24 px.
- Alvo lógico circular de **44 CSS px de diâmetro**, independente de zoom e DPR.
  Testes começam a 15–16 px do centro, fora do desenho visual.
- Rotação tem afastamento mínimo de 48 px do centro da borda superior para
  diminuir sobreposição. Prioridade: rotação, resize mais próximo, corpo e vazio.
- O desenho e o hit-test compartilham a projeção. Controles ocluídos pela peça
  não participam. O deslocamento entre dedo e âncora é compensado antes do
  raycast; a transformação continua usando o mesmo sistema UV.
- Desktop mantém handles na textura: quadrados de 12 × 12 e rotação de 14 unidades
  de diâmetro, com os alvos antigos. Essas medidas não são pixels fixos de tela.

## Layout e scroll

- Viewer em edição mobile: `clamp(420px, 65vw, 560px)`, sem redução para 30svh.
- Fluxo: viewer → Foto/Texto/Elemento → Undo/Redo → painel → restante da página.
- Bottom sheet continua recolhível. Expandido tem mínimo de 520 px e cresce com
  todo o conteúdo. Sai o limite `calc(42svh - 60px)` e o scroll interno mobile.
- Não há limite de 100vh para o editor mobile. O 100vh do drawer global do site
  não fazia parte deste problema e foi preservado.
- Fora do viewer, inclusive no painel, swipe vertical rola a página. Apenas o
  canvas captura os gestos de edição/órbita/pinch. Sliders têm altura de 44 px.
- Expandir não chama mais `scrollIntoView` no viewer. A ancoragem automática de
  scroll é desativada somente nesta página abaixo de 1024 px, evitando saltos
  para o rodapé ao abrir o painel.
- Desktop mantém duas colunas e viewer sticky. O painel usa scroll interno com
  `max-height: calc(100svh - 32px)` e não transfere scroll para a página.

## Medições no navegador

Alturas em CSS px, após selecionar uma fotografia. Janela com 844 px de altura
em 390/430 e 960 px nas demais larguras.

| Largura | Viewer | Conteúdo do painel | Scroll |
| --- | ---: | ---: | --- |
| 390 | 420 | 1139 | Página |
| 430 | 420 | 1139 | Página |
| 768 | 499 | 1146 | Página |
| 1024 | 430 | 928 visíveis | Interno do painel |
| 1280 | 538 | 928 visíveis | Interno do painel |
| 1440 | 600 | 928 visíveis | Interno do painel |

## Validação

Revisões automatizadas no Chrome headless com WebGL/SwiftShader e eventos reais
do protocolo CDP, incluindo emulação de touch. Não houve teste em aparelho físico.

Resultado final: **678 verificações aprovadas**, sem exceções de runtime nas
quatro suítes (191 mobile, 239 transformações/estado, 175 wrap e 73 inserção).
Lint, build e diff check aprovados. Uma execução paralela da suíte de
transformações teve timeout de navegação; a repetição isolada concluiu integralmente.

- `node scripts/personalizer-mobile-review.mjs`: zoom próximo/distante, segurança
  da câmera, seleção de foto pequena (100 × 60 na textura), nove handles,
  undo por gesto, resize lateral independente, drag, órbita no vazio, pinch,
  painel expandido/recolhido, scroll externo e no painel, acesso às últimas
  ações, oclusão, troca de breakpoints e ausência de overflow horizontal.
- `node scripts/personalizer-5c2a-review.mjs --transforms-only`: transformações
  por mouse/touch, estabilidade de textura/estado durante o gesto, histórico,
  controles do painel e cursores desktop.
- `node scripts/personalizer-wrap-review.mjs`: costura 360°, handles de foto e
  texto, história, continuidade da textura e oclusão. Coordenadas dos testes de
  rotação mobile atualizadas para a nova posição visual do grip.
- `node scripts/personalizer-insertion-review.mjs`: inserção visível preservada.
- `npm.cmd run lint`, `npm.cmd run build`, `git diff --check`.
- Build mantém o aviso de chunk 3D acima de 500 kB, sem erro de compilação.

Relatórios JSON e capturas ficam em `%TEMP%/sublime-personalizer-mobile-review`,
`%TEMP%/sublime-personalizer-5c2a-review`, `%TEMP%/sublime-personalizer-wrap-review`
e `%TEMP%/sublime-personalizer-insertion-review`.
