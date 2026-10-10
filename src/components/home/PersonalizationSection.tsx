import { ArrowUpRight, ImagePlus, Package, Sparkles } from "lucide-react"
import { Link } from "react-router"

const steps = [
  { title: "Escolhe o produto", description: "Caneca, íman, caderno ou fotopresente.", Icon: Sparkles },
  { title: "Personaliza", description: "Adiciona a tua foto, escreve um nome, escolhe a cor.", Icon: ImagePlus },
  { title: "Recebe algo único", description: "Uma prenda pensada por ti, ao teu gosto.", Icon: Package },
]

export default function PersonalizationSection() {
  return (
    <section id="personalizar" className="sh-personalization" aria-labelledby="personalization-title"><div className="sh-container sh-personalization-grid">
      <div className="sh-studio sh-corners"><img src="/images/personalization/caneca-base.png" alt="Caneca preparada para personalização com a tua imagem" loading="lazy" width={1024} height={1024} /><span className="sh-image-label">Personalização · prévia em tempo real</span><div className="sh-studio-sticker"><strong>3 passos</strong><span>Para o teu</span></div></div>
      <div className="sh-personalization-copy"><p className="sh-eyebrow">03 — Personalizados</p><h2 id="personalization-title">Uma prenda que<br />não existe em<br /><span className="sh-pink">nenhuma<br className="sh-desktop-break" /> prateleira.</span></h2><p className="sh-description">Adiciona uma fotografia, escreve um nome e escolhe a cor e a fonte. A prévia acompanha cada alteração.</p>
        <ol className="sh-personalization-steps">{steps.map(({ title, description, Icon }, index) => <li key={title}><span className="sh-step-index">0{index + 1}</span><Icon size={19} aria-hidden="true" /><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        <Link className="sh-button" to="/products?customizable=true">Começar a personalizar <ArrowUpRight size={15} /></Link>
      </div>
    </div></section>
  )
}
