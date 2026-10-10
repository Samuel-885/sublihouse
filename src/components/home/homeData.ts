export const homeCategories = [
  { name: "Canecas", image: "/images/home/categories/canecas.webp", description: "Uma caneca com a tua personalidade.", to: "/products?category=Canecas" },
  { name: "Ímanes", image: "/images/home/categories/imanes.webp", description: "A tua fotografia, sempre por perto.", to: "/products?category=%C3%8Dmanes" },
  { name: "T-shirts", image: "/images/home/categories/t-shirts.webp", description: "Uma ideia para vestir.", to: "/#contacto" },
  { name: "Fotopresentes", image: "/images/home/categories/fotopresentes.webp", description: "Fotos que se tornam memórias.", to: "/products?category=Fotopresentes" },
  { name: "Papelaria", image: "/images/home/categories/papelaria.webp", description: "Cadernos com um toque só teu.", to: "/products?category=Papelaria" },
  { name: "Porta-chaves", image: "/images/home/categories/porta-chaves.webp", description: "Pequenos detalhes, grandes histórias.", to: "/products?category=Porta-chaves" },
]

export const homeNavigation = [
  { label: "Loja", to: "/products" },
  { label: "Personalizados", to: "/#personalizar" },
  { label: "Coleções", to: "/#colecoes" },
  { label: "Sobre", to: "/#sobre" },
  { label: "Contacto", to: "/#contacto" },
]

// Frontend art direction, independent of catalogue/Storefront product media.
// Replace these local assets when the final Home photography is available.
export const homeHeroAssets = {
  main: {
    src: "/images/home/hero/hero-caneca.webp",
    alt: "Caneca com padrão abstrato em magenta e ciano",
    label: "Caneca · a tua fotografia",
  },
  stationery: {
    src: "/images/home/hero/hero-papelaria.webp",
    alt: "Caderno de capa castanha com uma caneta",
  },
  magnets: {
    src: "/images/home/hero/hero-imanes.webp",
    alt: "Ímanes com fotografias e memórias",
  },
}
