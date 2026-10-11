# Personalizador — Fase 5B

Implementação local concluída em 11/10/2026. A interface da Fase 5A foi preservada: as alterações de aplicação estão limitadas ao viewer, aos novos módulos 3D e a cinco regras CSS de integração.

## A. Dependências

| Dependência direta | Versão instalada |
| --- | --- |
| `three` | `0.186.1` |
| `@react-three/fiber` | `9.8.1` |
| `@react-three/drei` | `10.7.9` |
| `@types/three` (desenvolvimento) | `0.186.0` |

Versões fixadas no manifest e no lockfile. O manifest existente declara React/React DOM `^19.2.8`; a instalação existente resolve ambos para `19.3.0`, sem alteração dessas dependências. O npm confirmou as peer dependencies: Fiber `>=19 <19.4`, Drei `^19` e Fiber `^9.0.0`. A [documentação oficial do Fiber](https://r3f.docs.pmnd.rs/getting-started/installation) também indica Fiber 9 para React 19. Nenhuma biblioteca 3D adicional foi adicionada como dependência direta.

## B. Arquivos

Alterados:

- `package.json` e `package-lock.json`.
- `src/components/personalizer/PersonalizerViewer.tsx`.
- `src/components/personalizer/personalizer.css`.

Criados em `src/components/personalizer/3d/`:

- `PersonalizerScene.tsx`: câmara, luzes, controlos, ciclo de renderização e reset.
- `ProductModel.tsx`: seleção do modelo e ciclo de vida da textura.
- `MugModel.tsx`: geometria e materiais da caneca.
- `personalizer3dConfig.ts`: configuração tipada e resolução por produto.
- `createDemoTexture.ts`: composição demonstrativa no canvas.
- `useWebGLSupport.ts`: deteção de WebGL 2.
- `ViewerErrorBoundary.tsx`: isolamento de falhas da cena e do carregamento lazy.

Este relatório foi criado em `Planejamento/PERSONALIZER_FASE_5B.md`.

## C–G. Arquitetura, produto, geometria e textura

**C. Arquitetura:** `PersonalizerViewer → PersonalizerScene → ProductModel → MugModel`. A cena é carregada com `React.lazy` e `Suspense`. A imagem do produto é usada durante o carregamento. Um modelo GLB futuro pode substituir a implementação de `MugModel` sem tocar na página, painel, toolbar, quantidade ou WhatsApp.

**D. Configuração:** `getPersonalizer3DConfig(product)` devolve a configuração `kind: "mug"` apenas quando `customizable` é verdadeiro e a categoria é `Canecas`. Nos restantes casos devolve `null`. A regra de categoria está centralizada; o tipo `Product` e os dados existentes não foram alterados. A configuração contém câmara, target, limites dos controlos e dimensões da textura imprimível. Safe zones e configurações de modelos futuros ficam para fases posteriores.

**E. Caneca:** não existia modelo adequado em `public/models/`. Foi construída proceduralmente: `LatheGeometry` com perfil fechado para base, parede externa, borda arredondada, parede interna e fundo interior; meia `TorusGeometry` para a pega. Cerâmica branca com `MeshStandardMaterial`, metalness zero e roughness moderada. Nenhum asset ou modelo externo foi descarregado.

**F. CanvasTexture:** canvas HTML de 1024 × 512, fundo claro, formas rosa e verde, texto “A tua criação” e indicação “EXEMPLO · SUBLIME HOUSE”. `SRGBColorSpace`, filtro linear de ampliação, mipmaps para redução e `needsUpdate` na criação. A textura é reutilizada entre renders e descartada no unmount. O compositor futuro pode substituir o pintor atual e atualizar a textura; não existe persistência nesta fase.

**G. Área imprimível:** cilindro aberto de 96 segmentos, ligeiramente afastado da parede para evitar z-fighting. UVs contínuos no intervalo 0–1, uma volta completa, costura atrás. A impressão não cobre interior, fundo, borda ou pega. A mesh tem o nome `printable-surface`; os UVs permanecem disponíveis para a futura edição por interseção, sem implementar raycasting de edição nesta fase.

## H–N. Câmara e interação

**H. Câmara:** perspetiva de 35°, posição inicial `[2.4, 1.8, 5.5]`, target `[0.24, 0, 0]`, near/far `0.1/40`. O canvas acompanha o container e atualiza o aspeto da câmara no resize.

**I. OrbitControls:** pan desativado, damping `0.08`, velocidade de rotação manual `0.65`, velocidade de zoom `0.6`, distância entre `5.2` e `8.5`, ângulo polar entre `0.65` e `1.55` radianos.

**J. Rato:** arrastar gira; roda amplia dentro dos limites; arrastar com botão direito não desloca o target. Cursor grab/grabbing.

**K. Toque:** um dedo gira; dois dedos permitem zoom. `touch-action: none` está limitado ao canvas; a página continua a rolar fora do viewer.

**L. Auto-rotação:** velocidade `0.3`, suave, apenas antes da primeira interação. O evento de início dos controlos interrompe-a permanentemente durante a sessão. A inércia manual termina normalmente; não há retoma automática.

**M. Repor vista:** restaura posição, target e orientação inicial. Apenas os controlos são recriados para eliminar inércia pendente; o canvas, modelo e textura permanecem montados. Também mantém a auto-rotação parada. O botão permanece desativado nos fallbacks.

**N. Reduced motion:** a preferência do sistema é observada, incluindo alterações durante a sessão. Com `reduce`, a cena começa parada e mantém rotação manual e zoom.

## O–R. Fallbacks, bundle e performance

**O. Outros produtos:** mantêm `ProductImage` e a indicação de pré-visualização, sem prometer 3D. O caderno de ID 6 foi confirmado em 2D nas seis larguras testadas.

**P. WebGL e erros:** deteção de WebGL 2 antes de montar o canvas; o contexto temporário da deteção é libertado. Sem suporte, com perda de contexto ou com falha da cena, o viewer mostra a imagem e “A pré-visualização 3D não está disponível neste dispositivo.” A página e o WhatsApp continuam disponíveis. O ErrorBoundary contém também uma falha simulada na criação da textura.

**Q. Lazy loading:** build final:

| Chunk | Minificado | Gzip |
| --- | --- | --- |
| `index-GFam96fJ.js` | 355,24 kB | 107,39 kB |
| `PersonalizerScene-BxL0mQRi.js` | 929,45 kB | 246,98 kB |

O Vite emite o aviso esperado de chunk superior a 500 kB; a cena está separada por import dinâmico. Verificação de rede confirmou que Home, `/products`, `/cart` e `/personalize/6` não carregam os módulos 3D.

**R. Performance:** DPR limitado a 1–1,5; aproximadamente 3.264 triângulos, três geometrias e três chamadas de desenho por frame. Iluminação com uma hemisphere light e duas directional lights; sem sombras dinâmicas, pós-processamento, mapas de ambiente ou assets remotos. `frameloop="demand"` mantém frames durante a auto-rotação e durante alterações/inércia dos controlos; após estabilizar, fica em repouso. Nenhum estado React é atualizado a cada frame.

## S–W. Validação

**S. Desktop:** 1440, 1280 e 1024 px. Canvas e textura, enquadramento, rotação manual, auto-rotação e interrupção, reset, zoom limitado, ausência de pan, limites verticais, toolbar e ações desativadas verificados.

**T. Mobile/tablet:** 390, 430 e 768 px. Gestos de toque, pinch, scroll fora do viewer, ausência de overflow horizontal, resize/orientação, canvas do tamanho da superfície, reset e bottom sheet sem remontar a cena verificados. Capturas de desktop e mobile inspecionadas visualmente.

**U. Produtos e estados:** caneca ID 1 em 3D; caderno ID 6 em 2D; produto não personalizável ID 2 e ID inválido preservados; `?cartItemId=XYZ` reconhecido. Guardar, carrinho, histórico e ferramentas de edição continuam desativados. A demo não modifica o localStorage. Reduced motion, ausência de WebGL, perda de contexto e erro de criação de textura foram simulados.

QA consolidado: **125 verificações aprovadas**, nenhum erro inesperado ou asset em falta. O erro “Canvas 2D is unavailable” foi deliberadamente injetado para validar o ErrorBoundary e está registado separadamente. As verificações de repouso aguardam o fim da inércia; um prazo fixo inicial era insuficiente com renderização por software.

Ambiente: Chrome headless com SwiftShader e emulação de dispositivos/gestos via CDP. Isto valida comportamento e layout, mas não constitui medição de FPS ou teste em hardware físico Android/iOS. Evidências e scripts de QA estão na pasta temporária local `sublime-personalizer-3d-review` e nos arquivos `sublime-personalizer-3d-*-review.mjs`.

**V. Lint:** `npm.cmd run lint` aprovado, sem erros ou avisos.

**W. Build:** `npm.cmd run build` aprovado, incluindo TypeScript. Apenas o aviso de tamanho do chunk 3D descrito acima. `git diff --check` aprovado.

A Fase 5B termina aqui. Não foram implementados upload, edição real de texto/elementos, seleção, raycasting de edição, layers, undo/redo, exportação, gravação de design, personalização no carrinho ou Shopify. Header, Footer, outras páginas, dados de produtos e contextos de carrinho permanecem sem alterações.
