# Sublime House — Plano Geral do Projeto & Checklist Mestre

> Projeto de portfólio: React + TypeScript + Vite + Tailwind.  
> Figma: https://www.figma.com/design/HWiGfHbVom1LVcyQnqsdaK

## 1. Visão do projeto

A Sublime House será um front-end de e-commerce para uma loja real de presentes personalizados em Portugal. O projeto deve funcionar como aplicação de verdade e, ao mesmo tempo, demonstrar fundamentos sólidos de Front-end Júnior.

### Princípios

- O código será implementado manualmente para maximizar aprendizado.
- O Figma é a referência visual; não será usado para gerar o projeto automaticamente.
- A arquitetura deve crescer conforme surgirem necessidades reais.
- Responsividade é construída junto com cada componente.
- A UI começa com mocks e depois troca a fonte de dados pela integração real.
- Complexidade só entra quando resolve um problema existente.

## 2. Arquitetura

### Monorepo agora? Não.

No início teremos apenas um front-end React. Um monorepo adicionaria complexidade sem benefício concreto.

**Arquitetura inicial:**

```text
React + TypeScript + Vite
        ↓
UI
        ↓
Catálogo / Busca / Filtros / Carrinho / Personalizador
        ↓
Jumpseller
```

Considerar monorepo apenas se surgir uma camada de backend/API própria ou pacotes realmente compartilhados.

## 3. Stack planejada

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Context API
- useReducer
- localStorage
- Fetch API
- Jumpseller
- Git
- GitHub

### Não usar inicialmente

- Redux / Zustand
- React Query
- Axios
- Next.js
- biblioteca de componentes pronta
- backend próprio

## 4. Estrutura provável

```text
sublime-house/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── product/
│   ├── features/
│   │   ├── catalog/
│   │   ├── cart/
│   │   └── personalization/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── data/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── README.md
```

> Não criar todas essas pastas no primeiro dia. Cada pasta nasce quando houver responsabilidade real.

## 5. Fluxo principal

```text
HOME
  ↓
CATÁLOGO
  ↓
PRODUTO
  ↓
PERSONALIZADOR (quando aplicável)
  ↓
CARRINHO
  ↓
JUMPSELLER / CHECKOUT
```

### Rotas previstas

- `/` — Home
- `/products` — Catálogo
- `/products/:id` — Produto
- `/personalize/:id` — Personalizador
- `/cart` — Carrinho
- `*` — 404

## 6. Modelos conceituais

```text
Product
├── id
├── name
├── price
├── images
├── category
├── description
├── variants
└── customizable
```

```text
CartItem
├── product
├── quantity
├── variant
└── personalization
```

```text
Personalization
├── name
├── textColor
├── font
├── photo
└── productColor
```

## 7. Roadmap

### Fase 0 — Setup

- Node
- Vite
- React
- TypeScript
- Tailwind
- Git
- GitHub
- limpeza do template

**Estudar:** npm, package.json, Vite, TSX e Git básico.

### Fase 1 — Home visual

- Header
- Hero
- Categories
- ProductCard
- ProductGrid
- Personalization CTA
- Benefits
- Footer

**Estudar:** JSX, componentes, props, Tailwind, Flexbox e Grid.

### Fase 2 — Responsividade

Cada seção deve nascer em Desktop, Tablet e Mobile antes de ser considerada pronta.

**Estudar:** mobile-first, breakpoints, CSS Grid, Flexbox e tipografia responsiva.

### Fase 3 — Rotas

Adicionar React Router e as páginas principais.

**Estudar:** SPA, Link, Navigate, useParams.

### Fase 4 — Dados

Começar com produtos mockados, tipos e services. Depois conectar API.

**Estudar:** JSON, HTTP, fetch, async/await, Promise, try/catch, useEffect.

### Fase 5 — Catálogo

- busca
- filtro por categoria
- filtro por preço
- personalizável
- promoção
- ordenação
- chips
- loading
- error
- empty

**Estudar:** map, filter, sort, includes, eventos e estado.

### Fase 6 — Produto

- galeria
- nome
- descrição
- preço
- variantes
- quantidade
- estoque
- adicionar ao carrinho

### Fase 7 — Carrinho

- Context API
- useReducer
- adicionar/remover
- aumentar/diminuir quantidade
- totais
- contador no Header

### Fase 8 — Persistência

Salvar carrinho em `localStorage`.

### Fase 9 — Personalizador

- nome/mensagem
- fonte
- cor do texto
- cor do produto
- upload de imagem
- preview da imagem
- preview em tempo real
- área de impressão
- salvar personalização
- adicionar item personalizado ao carrinho

**Estudar:** controlled components, File API e `URL.createObjectURL()`.

### Fase 10 — Jumpseller

Spike técnico:

1. listar produtos
2. abrir produto/variante
3. criar carrinho
4. adicionar item
5. obter `continue_url`
6. abrir checkout

Validar separadamente como nome, foto, fonte e cor chegam à encomenda.

## 8. Responsividade

| Referência | Frame | Regra |
|---|---:|---|
| Desktop | 1440 px | experiência completa |
| Tablet | 834 px | reorganização real do layout |
| Mobile | 390 px | fluxo vertical e prioridade para toque |

### Regra de execução

```text
Header Desktop
→ Header Tablet
→ Header Mobile
→ concluído
→ próxima seção
```

### Grid de produtos

- Desktop: 4 colunas
- Tablet: 3 colunas
- Mobile: 2 colunas

## 9. Plano de estudos paralelo

| Etapa | Estudar |
|---|---|
| Setup | npm, Vite, Git, package.json |
| Home | JSX, componentes, props |
| Responsivo | Flexbox, Grid, breakpoints |
| Catálogo | arrays, map, filter, sort |
| Rotas | React Router |
| API | HTTP, fetch, async/await |
| Forms | controlled components |
| Carrinho | Context, reducer |
| Persistência | localStorage |
| Personalizador | state, File API |
| Integração | JSON, network, APIs |
| Final | acessibilidade, performance, deploy |

> Aprende → usa → encontra erro → entende → continua.

## 10. Git

### Branches

```text
main
feature/header
feature/catalog
feature/cart
feature/personalizer
```

### Exemplos de commits

```text
feat: add responsive header
feat: create product card component
feat: implement catalog filtering
feat: add cart context
feat: persist cart in localStorage
feat: add product personalizer
fix: prevent invalid cart quantities
```

## 11. Qualidade

Estados importantes:

- Loading
- Error
- Empty
- Disabled
- Hover
- Focus
- Selected
- Menu mobile aberto
- Drawer de filtros aberto
- Carrinho vazio
- Busca sem resultado
- Upload vazio
- Upload concluído

### Acessibilidade

- HTML semântico
- `button` para ações
- `label` em campos
- `alt` em imagens
- foco visível
- navegação por teclado
- contraste adequado

## 12. Testes

Adicionar gradualmente depois que a base React estiver sólida.

Prioridades:

- reducer do carrinho
- filtros
- cálculo de totais
- comportamentos críticos do personalizador

Possível stack: Vitest + React Testing Library.

## 13. Performance

Avaliar no final:

- lazy loading
- imagens
- code splitting
- Lighthouse
- memoização somente quando houver necessidade medida

## 14. Deploy e README

Entregáveis finais:

- URL pública
- README
- screenshots
- GIF/vídeo curto
- descrição técnica
- case study no portfólio

README deve conter:

- Sobre o projeto
- Problema
- Solução
- Funcionalidades
- Tecnologias
- Arquitetura
- Screenshots
- Como executar
- Aprendizados
- Próximos passos
- Desafios técnicos

---

# CHECKLIST MESTRE

## SETUP

- [ ] Node
- [ ] Vite
- [ ] React
- [ ] TypeScript
- [ ] Tailwind
- [ ] Git
- [ ] GitHub

## DESIGN SYSTEM

- [ ] cores
- [ ] tipografia
- [ ] spacing
- [ ] container
- [ ] buttons
- [ ] badges
- [ ] inputs

## HOME

- [ ] Header
- [ ] Hero
- [ ] Categories
- [ ] Featured Products
- [ ] Personalization CTA
- [ ] Benefits
- [ ] Footer
- [ ] Tablet
- [ ] Mobile

## ROUTING

- [ ] React Router
- [ ] Home
- [ ] Catalog
- [ ] Product
- [ ] Personalizer
- [ ] Cart
- [ ] 404

## CATALOG

- [ ] Mock products
- [ ] ProductCard
- [ ] ProductGrid
- [ ] Search
- [ ] Category filter
- [ ] Price filter
- [ ] Personalizable filter
- [ ] Promotion filter
- [ ] Sorting
- [ ] Filter chips
- [ ] Loading
- [ ] Error
- [ ] Empty
- [ ] Tablet
- [ ] Mobile
- [ ] Filter drawer

## PRODUCT

- [ ] Product gallery
- [ ] Product info
- [ ] Variants
- [ ] Quantity
- [ ] Add to cart
- [ ] Normal product
- [ ] Customizable product
- [ ] Related products
- [ ] Tablet
- [ ] Mobile

## CART

- [ ] CartContext
- [ ] useReducer
- [ ] Add item
- [ ] Remove item
- [ ] Increase quantity
- [ ] Decrease quantity
- [ ] Calculate subtotal
- [ ] Header counter
- [ ] Empty state
- [ ] localStorage
- [ ] Tablet
- [ ] Mobile

## PERSONALIZER

- [ ] Text input
- [ ] Font selection
- [ ] Text color
- [ ] Product color
- [ ] Image upload
- [ ] Image preview
- [ ] Live preview
- [ ] Print area
- [ ] Save personalization
- [ ] Add personalized item to cart
- [ ] Tablet
- [ ] Mobile

## API

- [ ] understand fetch
- [ ] create product service
- [ ] loading
- [ ] error handling
- [ ] connect catalog
- [ ] replace mocks

## JUMPSELLER

- [ ] investigate public catalog
- [ ] fetch products
- [ ] fetch variants
- [ ] create cart
- [ ] add item
- [ ] continue_url
- [ ] test checkout
- [ ] investigate personalization data

## QUALITY

- [ ] semantic HTML
- [ ] keyboard navigation
- [ ] visible focus
- [ ] labels
- [ ] alt text
- [ ] responsive checks
- [ ] loading states
- [ ] error states
- [ ] empty states

## TESTS

- [ ] cart reducer
- [ ] filters
- [ ] totals
- [ ] basic components

## FINAL

- [ ] bugs
- [ ] Lighthouse
- [ ] responsive QA
- [ ] deploy
- [ ] README
- [ ] screenshots
- [ ] portfolio case study

---

## Definition of Done

Ao terminar, o projeto deve demonstrar:

- React: componentes, props, state, effects, context, reducer, forms e routing
- TypeScript: interfaces, props types, unions e tipos de API
- Front-end: responsividade, acessibilidade, estados, consumo de API e persistência
- Engenharia: Git, arquitetura simples, decisões justificadas e integração real

## Primeiro checkpoint

- [ ] verificar Node
- [ ] criar Vite + React + TypeScript
- [ ] entender os arquivos gerados
- [ ] configurar Tailwind
- [ ] limpar o template padrão
- [ ] criar repositório Git
- [ ] fazer o primeiro commit
- [ ] começar o Header
