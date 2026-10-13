# Fase 5C.1 — editor local de fotografia e texto

Implementado sobre `1213e9c` (`feat: add 3d foundation to product personalizer`). Sem alterações em produtos, carrinho, Shopify, Home, Header, Footer ou nas outras páginas. Sem novas dependências. Sem commit.

## A. Arquivos

Criados:

- `src/components/personalizer/editor/types.ts`
- `src/components/personalizer/editor/geometry.ts`
- `src/components/personalizer/editor/textLayout.ts`
- `src/components/personalizer/editor/createDesignStore.ts`
- `src/components/personalizer/editor/compositor.ts`
- `src/components/personalizer/3d/useDesignTextures.ts`
- `src/components/personalizer/3d/useDesignInteraction.ts`
- `scripts/personalizer-5c1-review.mjs`
- `Planejamento/FASE-5C1.md`

Alterados:

- `src/pages/Personalizer.tsx`
- `src/components/personalizer/PersonalizerViewer.tsx`
- `src/components/personalizer/PersonalizerToolbar.tsx`
- `src/components/personalizer/PersonalizerPanel.tsx`
- `src/components/personalizer/PersonalizerToolControls.tsx`
- `src/components/personalizer/personalizer.css`
- `src/components/personalizer/3d/PersonalizerScene.tsx`
- `src/components/personalizer/3d/ProductModel.tsx`
- `src/components/personalizer/3d/MugModel.tsx`

Removido após integrar e compilar o substituto, e verificar que não havia consumidores: `src/components/personalizer/3d/createDemoTexture.ts`.

## B–E. Modelo de dados, store, compositor e texturas

O design contém `elements` e `selectedElementId`. Elementos têm UUID, tipo, centro `x/y`, dimensões, rotação em radianos e `zIndex`. Fotografia acrescenta `source/name`; texto acrescenta `content/font/fontSize/color/align`. O espaço lógico é sempre 1024 × 512, independente do viewport.

`createDesignStore` não importa Three.js ou React. Expõe `getDesign`, `getSnapshot`, `subscribe`, `subscribePaint`, `select`, `addPhoto`, `addText`, `updateText`, `refreshTextMetrics`, `move`, `commit`, `remove`, `replacePhoto`, `getPhoto` e `cleanup`.

Há dois canais: pintura e React. `move` atualiza o design e notifica apenas a pintura; o snapshot usado por `useSyncExternalStore` mantém a identidade durante o gesto. `commit` publica o resultado no final, inclusive em cancelamento. Não há histórico ou rollback de gestos.

O compositor limpa o canvas, preenche a base cerâmica e percorre os elementos por `zIndex` crescente. Fotografias e textos são intercalados pela ordem visual, permitindo foto sobre texto e texto sobre foto. O compositor da arte não desenha seleção. O compositor da seleção usa outro canvas transparente.

Existe um par ativo de `CanvasTexture`: arte e seleção, ambas 1024 × 512, em `SRGBColorSpace`, com `LinearFilter` e `LinearMipmapLinearFilter`. Um único `requestAnimationFrame` pendente agrupa notificações; redesenha os canvases existentes, marca `needsUpdate` e chama `invalidate`. Texturas, canvases e geometria não são recriados durante o arrasto.

O contexto 2D usa `willReadFrequently` para as leituras de upload para WebGL. Isto também resolveu no QA um contorno antigo que persistia ao limpar o canvas de seleção com aceleração gráfica.

## F–G. Fotografia e texto

O botão Foto aciona um input local de ficheiros. Aceita MIME JPEG, PNG e WebP até 20 MB. Formatos não aceites, excesso de tamanho e falha de decodificação têm mensagens acessíveis. A imagem carrega antes de entrar no design; o maior lado inicial mede 280 unidades, preservando a proporção. A nova fotografia é selecionada.

Substituir mantém UUID, centro, dimensões, rotação e ordem. A nova imagem é encaixada proporcionalmente na caixa existente, sem esticar nem recortar; proporções diferentes podem deixar espaço livre dentro da caixa. Apagar remove sem modal e limpa a seleção.

Texto cria «O teu texto», selecionado, com Figtree e tamanho lógico 36. Conteúdo, Figtree/Arial/Georgia, cor nativa e alinhamento left/center/right funcionam em tempo real. `measureText` e o mesmo layout usado na pintura mantêm a caixa coerente com o hit-test. Suporta quebras de linha, quebra automática e até 600 caracteres no campo. Textos que excedem a altura são reduzidos proporcionalmente para caber; não são truncados. `document.fonts.ready` recalcula medidas sem atrasar a criação.

## H–M. Superfície, seleção, UV, hit-test, drag e OrbitControls

As quatro funções continuam em meshes separadas:

| Mesh | Geometria / responsabilidade |
| --- | --- |
| `ceramic-shell` | LatheGeometry original: corpo, interior, borda e base |
| `printable-surface` | CylinderGeometry aberta original, raio 0.942, altura 1.94; textura da arte e interseções UV |
| `selection-overlay` | CylinderGeometry aberta com o mesmo UV, raio 0.945; material transparente, sem escrita de profundidade |
| `ceramic-handle` | TorusGeometry original da pega |

Nenhuma mesh tem duas geometrias concorrentes. O overlay usa `raycast={() => {}}`, não acrescentando interseções. O raycast considera a superfície física mais próxima e só aceita o resultado se for `printable-surface`; pega e cerâmica podem ocluir a impressão.

A única conversão UV é `x = u * 1024`, `y = (1 - v) * 512`. A orientação original e a costura traseira foram mantidas. O hit-test percorre o maior `zIndex` primeiro e transforma o ponto para o espaço local do elemento, incluindo a rotação.

O listener nativo de `pointerdown` na fase de captura decide o gesto antes do listener do OrbitControls:

- Sobre elemento: seleciona, guarda o offset, desabilita os controlos imediatamente, captura o ponteiro e move o elemento por UV.
- Sobre impressão vazia: desseleciona e deixa o evento seguir para o OrbitControls.
- Fora da impressão: não há seleção nem movimento de elementos.

Ao sair da superfície visível, o arrasto mantém a última posição válida. Na costura, deltas horizontais são desembrulhados e a caixa é limitada à área imprimível, considerando a rotação. **Nesta fase os elementos não atravessam nem se repetem do outro lado da costura.**

`pointerup`, `pointercancel`, perda de captura, blur e desmontagem libertam o gesto e reativam os controlos. Um segundo dedo durante o arrasto de elemento não inicia órbita concorrente. Pinch iniciado em área vazia continua disponível.

Auto-rotação para ao interagir; adicionar conteúdo não a reinicia. Reduced motion, limites de zoom e câmara permanecem. Repor vista só altera câmara/controlos, preservando elementos e seleção.

## N–O. Painel e mobile

O painel continua genérico por tipo. A ferramenta ativa deriva do elemento selecionado, evitando estados divergentes. Substituir/apagar estão ativos na fotografia; conteúdo/fonte/cor/alinhamento/apagar estão ativos no texto. Elementos decorativos, duplicar, recortar, tamanho, rotação e ordem de camadas permanecem desabilitados.

O bottom sheet conserva o layout e o estado expandido/recolhido. Foi retirada a chave que o remontava ao trocar de ferramenta: selecionar diretamente atualiza o conteúdo, sem expandir, recolher ou reiniciar a animação. O viewer retém `touch-action: none`; fora dele a página continua a rolar. Cursores: move sobre elementos, grab sobre área vazia, grabbing durante o gesto.

## P–Q. Cleanup e fallbacks

Object URLs são revogadas ao substituir, apagar, falhar a carga ou desmontar. O store remove as referências às imagens e cancela cargas pendentes; a conclusão assíncrona não reinsere imagens numa sessão encerrada. Subscriptions, listeners, captura, RAF de pintura e texturas são libertados pelos respetivos cleanups.

Produtos sem modelo mantêm `ProductImage` e não descarregam a cena 3D. Falta de WebGL preserva o fallback e a mensagem, com ferramentas 3D desabilitadas. Rotas inválidas e produtos não personalizáveis mantêm os seus fluxos. `cartItemId` continua apenas reconhecido; quantidade e opção WhatsApp conservam o código existente. Carrinho, guardar e undo/redo continuam desabilitados.

## R. QA

Executado em Chrome headless no Windows, com renderização WebGL por SwiftShader e gestos via Chrome DevTools Protocol. **119 verificações aprovadas, zero exceções JavaScript.** Não houve teste em dispositivos físicos nem em Safari/Firefox.

- Caneca ID 1: 390, 430, 768, 1024, 1280 e 1440 px.
- Em cada largura: design limpo, meshes separadas, fotografia, seleção/arrasto, câmara bloqueada durante drag, snapshot React estável, identidade da textura/geometria preservada, commit, órbita vazia, remoção visual da seleção, reset e texto sobre fotografia arrastável.
- 390/430/768: touch, bottom sheet preservado, pinch, scroll fora do viewer; todas as larguras sem overflow horizontal.
- JPG/PNG/WebP, formato inválido, tamanho excessivo, ficheiro corrompido, proporção inicial, substituição, exclusão e revogação de URLs.
- Duas fotografias e dois textos; conteúdo multilinha, três fontes, cor e três alinhamentos.
- Hit-test com rotação e prioridade de `zIndex` nos dois sentidos; limites com rotação.
- UV real no centro, esquerda, direita, topo e base. Arrasto real através da costura sem teletransporte.
- `pointercancel`, perda de captura, blur, desmontagem com imagens e desmontagem com carga pendente.
- Auto-rotação, reduced motion, seleção preservada por reset e ações futuras desabilitadas.
- Caderno ID 6 com fallback 2D e sem descarga da cena; produto não personalizável, ID inválido, `cartItemId` e falta de WebGL.
- Inspeção visual das capturas mobile e desktop.

Para repetir:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5174
# Noutro terminal:
node scripts/personalizer-5c1-review.mjs
```

O script aceita `CHROME_PATH` e `REVIEW_URL`. É um teste do servidor de desenvolvimento: inspeciona o store através do React Fiber apenas no próprio teste, sem expor APIs de diagnóstico na aplicação. Relatório JSON e seis capturas ficam em `%TEMP%/sublime-personalizer-5c1-review/`.

## S–T. Lint e build

- `npm.cmd run lint`: aprovado, sem erros.
- `npm.cmd run build`: aprovado, TypeScript e Vite.
- `git diff --check`: aprovado.
- O Vite mantém o aviso de bundle superior a 500 kB para o chunk 3D, carregado de forma lazy. Não foi incluída nenhuma dependência nova.
- O build intermediário foi executado depois da integração de modelo/compositor/texturas, antes de toolbar e painel.

## Respostas explícitas e próximas fases

1. Sim, `printable-surface` mantém exatamente esse nome.
2. Sim, shell, impressão, overlay e pega são meshes separadas.
3. O overlay tem um raycast vazio; só a impressão pode produzir pontos de design.
4. O hit-test no início do gesto decide: elemento move com órbita desabilitada; vazio deixa o OrbitControls girar.
5. Pointermove atualiza apenas o store e a pintura agrupada em RAF. O React recebe o snapshot consolidado ao terminar.
6. URLs e imagens são libertadas na substituição, exclusão, erro e desmontagem, incluindo cargas pendentes.
7. Ficam para 5C.2 ou fases seguintes: duplicar, resize/rotate por handles, crop avançado, biblioteca decorativa, layers completos, undo/redo, persistência, guardar, carrinho, backend/upload remoto e Shopify. Nenhum destes fluxos foi implementado.
