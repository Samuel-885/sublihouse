# Sublime House

Frontend de um e-commerce de presentes personalizados, desenvolvido como projeto real e de portfólio.

## Sobre o projeto

A Sublime House reúne produtos prontos a oferecer e produtos personalizáveis numa experiência de compra pensada para desktop e mobile. O projeto explora a descoberta de produtos, a personalização e a gestão do carrinho.

O catálogo utiliza dados locais. O checkout é demonstrativo: não cria encomendas nem processa pagamentos. A integração com Shopify está prevista para uma próxima etapa.

## Funcionalidades

- Home responsiva e catálogo de produtos.
- Busca com autocomplete e navegação por teclado.
- Filtros e ordenação do catálogo.
- Página de detalhes do produto.
- Personalizador com nome, fotografia, cor, fonte e quantidade.
- Seleção de fotografia local com preview.
- Carrinho com produtos comuns agrupados e personalizações em linhas separadas.
- Persistência do carrinho via localStorage, com validação dos dados guardados.
- Menu e filtros em drawers no mobile.
- Layout responsivo e acessibilidade básica: labels, mensagens de estado e suporte a movimento reduzido.
- Atalhos para WhatsApp e pedidos especiais.
- Página 404.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, React Router, Context API, Lucide React e localStorage.

## Estrutura / arquitetura

```text
src/
├── pages/       # Páginas e fluxos de navegação
├── components/  # Componentes da Home, layout e produtos
├── context/     # Estado do carrinho e persistência
├── data/        # Catálogo local e configurações
├── types/       # Tipos de produtos e personalizações
└── hooks/       # Hooks reutilizáveis
```

O React Router gere as rotas e a Context API partilha o carrinho. As imagens de produto usam `product.image`, com `ProductArtwork` como fallback quando não há uma imagem disponível.

## Personalização

Produto personalizável → personalizador → nome/foto/cor/fonte → carrinho.

A fotografia selecionada é usada apenas no preview local. O carrinho guarda o nome do ficheiro, não a imagem; o upload persistente ainda não está implementado.

## Carrinho

Produtos comuns iguais agrupam numa única linha, somando as quantidades. Produtos personalizados permanecem em linhas separadas, identificadas por `cartItemId`.

O carrinho é guardado no localStorage do navegador. O botão de finalizar compra apresenta uma explicação sobre o checkout futuro e mantém os itens intactos.

## Próximos passos

- Integração com a Shopify Storefront API.
- Checkout real.
- Upload persistente das imagens de personalização.
- Conteúdo e imagens definitivas.
- Páginas específicas de categorias.

## Executando localmente

Requisito: Node.js compatível com o Vite atual (20.19+ na versão 20, ou 22.12+).

```bash
npm install
npm run dev
```

Para validar a versão de produção e a qualidade do código:

```bash
npm run build
npm run lint
```

O build gera os ficheiros de produção em `dist/`.

## Deploy na Vercel

Importa o repositório com o preset **Vite**, comando de build `npm run build` e diretório de saída `dist`. A versão atual não exige variáveis de ambiente.

O ficheiro `vercel.json` encaminha as rotas da aplicação para `index.html`, permitindo abrir ou atualizar diretamente páginas como `/products/1`, `/cart` e `/personalize/1`. Noutros serviços de alojamento, configura o fallback SPA equivalente.

## Autor

Samuel Campos

- GitHub: [Samuel-885](https://github.com/Samuel-885)
- LinkedIn: [Samuel Campos](https://www.linkedin.com/in/samuel-campos-385a93170/)
