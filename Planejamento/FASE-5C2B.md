# FASE 5C.2B — tipografia do personalizador

Concluída em 15/10/2026. Alterações locais para revisão, sem commit.

**A. Arquivos criados/alterados**

- Criado `src/components/personalizer/editor/fontCatalog.ts`: catálogo, variantes, resolução e carregamento.
- Alterado `src/components/personalizer/editor/types.ts`: modelo tipográfico único.
- Alterado `src/components/personalizer/editor/textLayout.ts`: layout, medição e desenho compartilhados.
- Alterado `src/components/personalizer/editor/compositor.ts`: delegação do texto ao layout compartilhado.
- Alterado `src/components/personalizer/editor/createDesignStore.ts`: padrões, normalização e atualização assíncrona das métricas.
- Alterado `src/components/personalizer/PersonalizerToolControls.tsx`: controles tipográficos acessíveis.
- Criado `public/fonts/personalizer/`: 25 TTF, 12 licenças OFL, 12 metadados upstream, README e manifesto SHA-256.
- Criado `scripts/personalizer-5c2b-review.mjs`: QA da tipografia com Chrome/CDP, sem novas dependências.
- Alterado `scripts/personalizer-5c2a-review.mjs`: três opções do teste de fontes e leitura de `fontFamily`, acompanhando o modelo atual.
- Criado este relatório.

**B. Modelo de TextElement**

`content`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `underline`,
`letterSpacing`, `lineHeight`, `textTransform`, `color`, `align`, além de
`id`, `x/y`, `width/height`, `rotation` e `zIndex`.

`font` foi substituído por `fontFamily`, sem estado duplicado. Padrão: primeira
família do catálogo, tamanho 36, peso 400, estilo normal, sem sublinhado,
espaçamento 0, entrelinhas 1,3 e transformação `none`. O tamanho mantém 12–140.

**C. Catálogo e licenças**

| Categoria | Fontes |
|---|---|
| Modernas | Figtree, Montserrat, Poppins, Archivo |
| Elegantes | Playfair Display, Cormorant Garamond, DM Serif Display |
| Manuscritas | Caveat, Dancing Script, Pacifico |
| Divertidas | Fredoka, Baloo 2 |

Todas as 12 famílias incluem SIL Open Font License 1.1, adequada ao uso comercial
e à distribuição com o projeto. Os binários originais não foram modificados;
somente os nomes de arquivos com colchetes foram adaptados para Windows.
Procedência, pesos e itálicos estão documentados em
[README das fontes](../public/fonts/personalizer/README.md).

**D. Carregamento e fallback**

Fontes locais carregadas sob demanda com `FontFace.load()`, registro em
`document.fonts` e `document.fonts.load()`. Promises e recursos do navegador são
reaproveitados. Famílias CSS privadas evitam colisões com as fontes globais do
site. O download completo de 8,74 MB não ocorre ao abrir o editor.

A interface pode mostrar fallback enquanto carrega. Ao concluir, o store mede
novamente o design, os estados de undo/redo e a transação ativa, e publica a
atualização de pintura/seleção sem criar histórico. A resposta atrasada não
restaura conteúdo antigo. Callbacks de stores encerrados são ignorados.
Falhas mantêm fallback genérico seguro sem interromper edição ou compositor.

**E–H. Negrito, itálico, sublinhado e pesos**

B alterna entre 400 e 700; I alterna normal/italic; U altera `underline`.
Todos possuem nome acessível, `aria-pressed` e foco visível. Fontes sem negrito
ou sem itálico real desabilitam o controle correspondente. Ao trocar de família,
o store normaliza pesos/estilos para os suportados.

O seletor oferece 400/500/600/700 (Regular/Medium/Semi Bold/Bold), exceto DM Serif
Display e Pacifico, que oferecem somente 400. Há itálico real nas quatro modernas,
Playfair Display, Cormorant Garamond e DM Serif Display. Total: 67 combinações.

Sublinhado é uma linha no Canvas para cada linha de texto, com posição baseada
na baseline, largura completa, mesma cor, alinhamento e transformação geométrica.
Participa da arte final. Não depende de CSS.

**I–K. Espaçamentos e transformação de caixa**

- Letras: −5 a 30 pixels lógicos, passo 0,5. Medição e desenho utilizam as mesmas posições de grafemas, sem depender de `context.letterSpacing`.
- Linhas: multiplicador 0,8–2, passo 0,05. Preserva quebras manuais e wrapping existente.
- Caixa: normal, maiúsculas e minúsculas. `content` e textarea conservam o original; transformação ocorre apenas no layout/render.

**L–M. Medição e compositor**

`canvasFont()` produz uma única definição de fonte. `measureTextLine()` calcula
avanços e limites reais dos glifos; `layoutText()` organiza linhas e dimensões;
`drawText()` usa esses resultados para pintar. Os limites incluem saliências de
itálicos/manuscritas, acentos, descendentes e sublinhado. Segmentação por grafema
preserva acentos combinantes e sequências emoji.

Mantidos canvas, CanvasTexture, cena e geometria. As notificações existentes
disparam pintura, `needsUpdate` e `invalidate`. Seleção e handles recebem as
dimensões atualizadas.

**N–O. Resize e wrap 360°**

Resize por canto continua alterando `fontSize`. O encaixe do texto usa escala
uniforme; não há deformação independente de X/Y. Todas as propriedades seguem
preservadas. O algoritmo de wrap permanece intacto. Texto avançado foi validado
em x=0, 2, 1022 e 1024, incluindo pintura nas duas bordas, hit-test, movimento,
resize, rotação e undo/redo.

**P. Histórico**

Todas as propriedades entram no histórico. Os sliders reutilizam transações:
várias atualizações visuais e um único undo no término do gesto. Digitação é
agrupada até blur. Seletores de fonte/peso/caixa registram alterações discretas.
Duplicação e camadas preservam a tipografia completa.

Os atalhos opcionais Ctrl/Cmd+B/I/U não foram adicionados. Os botões funcionam
por teclado, e o undo nativo em campos permanece preservado.

**Q–R. Mobile e desktop**

Verificados 390, 430, 768, 1024, 1280 e 1440 px. Preservados scroll externo,
viewer grande, bottom sheet, zoom, pinch e alvos touch de 44 px no mobile;
scroll interno do painel e viewer sticky no desktop. Testados gestos reais de
resize em texto bold/italic/underline e ativação por teclado com foco visível.
Screenshots do painel e do viewer foram inspecionados.

**S. QA — 1.052 verificações aprovadas**

| Script | Verificações | Resultado |
|---|---:|---|
| personalizer-5c2b-review.mjs | 255 | PASS |
| personalizer-5c2a-review.mjs | 358 | PASS |
| personalizer-wrap-review.mjs | 175 | PASS |
| personalizer-mobile-review.mjs | 191 | PASS |
| personalizer-insertion-review.mjs | 73 | PASS |

Zero falhas e zero exceções JavaScript nos relatórios finais. A contagem é a soma
das verificações dos cinco scripts; inclui sobreposição de cobertura de regressão
entre baterias, mas não soma execuções repetidas durante o desenvolvimento.

Cobertura: todas as famílias e variantes oferecidas, carga atrasada e falha de
fonte, pixels/métricas, oito combinações B/I/U, espaçamentos, alinhamentos,
multilinha, transformação não destrutiva, histórico por propriedade, transações,
resize, costura, fotos/upload/cover/cantos, camadas, duplicação, inserção visível,
OrbitControls, pinch, reset, WebGL fallback e produtos com fallback 2D.

Execução: iniciar `npm.cmd run dev -- --host 127.0.0.1 --port 5174` e rodar
`node scripts/<nome-do-script>`. Os testes usam Chrome headless; `CHROME_PATH` e
`REVIEW_URL` permitem substituir navegador e endereço. JSON e screenshots ficam
em `%TEMP%/sublime-personalizer-<bateria>-review/`.

**T. Qualidade e limitações**

- `npm.cmd run lint`: PASS.
- `npm.cmd run build`: PASS. Mantém aviso de chunk 3D acima de 500 kB; não é falha de compilação.
- `git diff --check`: PASS.
- QA automatizado em Chrome/Chromium com emulação de viewport e touch; Safari/Firefox e aparelhos físicos não foram validados.
- Select nativo agrupado por categoria; a fonte selecionada tem preview, mas as opções não prometem preview individual consistente entre navegadores.
- Espaçamento diferente de zero desenha grafema por grafema: pode separar conexões/ligaturas de fontes manuscritas. Em zero, preserva o shaping nativo.
- Fontes TTF completas somam 8,74 MB e são carregadas sob demanda. Não houve conversão/subsetting dos binários licenciados.

**Respostas diretas**

1. **Quantas fontes?** 12.
2. **Quais?** Figtree, Montserrat, Poppins, Archivo, Playfair Display, Cormorant Garamond, DM Serif Display, Caveat, Dancing Script, Pacifico, Fredoka e Baloo 2.
3. **Licenças adequadas?** Sim, OFL 1.1 incluída para cada família.
4. **Bold/italic reais?** Sim, variantes/instâncias reais quando suportadas; controles indisponíveis ficam desabilitados.
5. **Underline no Canvas?** Sim, por linha e na arte final.
6. **Letter spacing na medição e render?** Sim, mesma matemática.
7. **Line height multilinha?** Sim, com quebras manuais preservadas.
8. **Resize sem deformar?** Sim, altera fontSize e mantém escala uniforme.
9. **Undo/redo completo?** Sim, incluindo todas as propriedades tipográficas.
10. **Texto na costura 360°?** Sim, validado nos dois lados e durante transformações.
11. **Quantos testes passaram?** 1.052 verificações nos cinco scripts.
12. **Limitações conhecidas?** As descritas em T; atalhos opcionais B/I/U não implementados.
