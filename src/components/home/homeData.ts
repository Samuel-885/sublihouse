export const homeCategories = [
  { name: "Canecas", image: "/images/products/caneca-tematica.png", description: "Uma caneca com a tua personalidade.", to: "/products?category=Canecas" },
  { name: "Ímanes", image: "/images/products/iman-personalizado.png", description: "A tua fotografia, sempre por perto.", to: "/products?category=%C3%8Dmanes" },
  { name: "T-shirts", image: null, description: "Uma ideia para vestir.", to: "/#contacto" },
  { name: "Fotopresentes", image: "/images/products/fotopresente.png", description: "Fotos que se tornam memórias.", to: "/products?category=Fotopresentes" },
  { name: "Papelaria", image: "/images/products/caderno-personalizado.png", description: "Cadernos com um toque só teu.", to: "/products?category=Papelaria" },
  { name: "Porta-chaves", image: "/images/products/porta-chaves.png", description: "Pequenos detalhes, grandes histórias.", to: "/products?category=Porta-chaves" },
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
    src: "/images/personalization/caneca-base.png",
    alt: "Caneca branca pronta para receber a tua fotografia",
    label: "Caneca · a tua fotografia",
  },
  stationery: {
    src: "/images/hero/product-2.png",
    alt: "Cadernos personalizados com nomes e flores",
  },
  magnets: {
    src: "/images/hero/product-4.png",
    alt: "Ímanes com fotografias e memórias",
  },
}
