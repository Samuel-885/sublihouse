# Fontes do personalizador

Arquivos originais obtidos em 15/10/2026 de https://github.com/google/fonts/tree/main/ofl.
Cada diretório preserva `OFL.txt` (copyright e SIL Open Font License 1.1) e
`METADATA.pb` (família, variantes, e referências upstream). A OFL permite uso,
incorporação e distribuição com o projeto, inclusive comercial; os arquivos de
fonte não devem ser vendidos isoladamente. As artes geradas não herdam a OFL.

Os binários não foram modificados. Nos nomes de arquivo variáveis, `[` foi
substituído por `-` e `]` removido para compatibilidade com ferramentas Windows.
`integrity.json` registra tamanho e SHA-256 dos 25 binários incluídos (8,74 MB).

| Categoria | Família / diretório | Pesos oferecidos | Itálico real |
|---|---|---|---|
| Modernas | Figtree / figtree | 400, 500, 600, 700 | Sim |
| Modernas | Montserrat / montserrat | 400, 500, 600, 700 | Sim |
| Modernas | Poppins / poppins | 400, 500, 600, 700 | Sim |
| Modernas | Archivo / archivo | 400, 500, 600, 700 | Sim |
| Elegantes | Playfair Display / playfairdisplay | 400, 500, 600, 700 | Sim |
| Elegantes | Cormorant Garamond / cormorantgaramond | 400, 500, 600, 700 | Sim |
| Elegantes | DM Serif Display / dmserifdisplay | 400 | Sim |
| Manuscritas | Caveat / caveat | 400, 500, 600, 700 | Não |
| Manuscritas | Dancing Script / dancingscript | 400, 500, 600, 700 | Não |
| Manuscritas | Pacifico / pacifico | 400 | Não |
| Divertidas | Fredoka / fredoka | 400, 500, 600, 700 | Não |
| Divertidas | Baloo 2 / baloo2 | 400, 500, 600, 700 | Não |

São 12 famílias e 67 combinações oferecidas de peso/estilo. Algumas fontes
variáveis possuem intervalos maiores: o catálogo limita a seleção a quatro
pesos para manter a ferramenta compacta. Os demais eixos usam seus padrões.

O catálogo executável fica em `src/components/personalizer/editor/fontCatalog.ts`.
O carregamento é local e sob demanda por variante, com cache de promises e do
navegador. Não se faz download das 12 famílias ao abrir o editor. Famílias CSS
privadas evitam conflitos com as fontes da interface geral do site.
