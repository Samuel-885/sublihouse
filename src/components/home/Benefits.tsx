import { Headphones, PackageCheck, Palette, ShieldCheck, Sparkles } from "lucide-react"

const benefits = [
  { title: "Compra com atenção", description: "Revê a tua prenda antes de encomendar.", Icon: ShieldCheck },
  { title: "Preparado para ti", description: "Consulta os detalhes de produção e envio.", Icon: PackageCheck },
  { title: "Personalização real", description: "Prévia antes de comprar.", Icon: Palette },
  { title: "Atendimento próximo", description: "Fala connosco pelo WhatsApp.", Icon: Headphones },
  { title: "Cada detalhe conta", description: "Fotos e palavras com significado.", Icon: Sparkles },
]
export default function Benefits() {
  return <section className="sh-benefits" aria-label="Detalhes que fazem a diferença"><div className="sh-container sh-benefits-grid">{benefits.map(({ title, description, Icon }) => <article key={title}><Icon size={24} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}</div></section>
}
