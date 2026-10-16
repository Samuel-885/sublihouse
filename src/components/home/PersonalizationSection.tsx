import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ArrowUpRight, ImagePlus, Package, Sparkles } from "lucide-react"
import { Link } from "react-router"
import ViewerErrorBoundary from "../personalizer/3d/ViewerErrorBoundary"

const HomeMugShowcase = lazy(() => import("./HomeMugShowcase"))

const steps = [
  { title: "Escolhe o produto", description: "Caneca, íman, caderno ou fotopresente.", Icon: Sparkles },
  { title: "Personaliza", description: "Adiciona a tua foto, escreve um nome, escolhe a cor.", Icon: ImagePlus },
  { title: "Recebe algo único", description: "Uma prenda pensada por ti, ao teu gosto.", Icon: Package },
]

export default function PersonalizationSection() {
  const studio = useRef<HTMLDivElement>(null)
  const [loadDemo, setLoadDemo] = useState(false)
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => { setFailed(true); setReady(false) }, [])

  useEffect(() => {
    const element = studio.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setActive(entry.isIntersecting)
      if (entry.isIntersecting) setLoadDemo(true)
    }, { rootMargin: "180px" })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="personalizar" className="sh-personalization" aria-labelledby="personalization-title"><div className="sh-container sh-personalization-grid">
      <div ref={studio} className="sh-studio sh-corners">
        <div className="sh-mug-setting" aria-hidden="true" />
        {loadDemo && !failed && <ViewerErrorBoundary onError={onError}><Suspense fallback={null}>
          <HomeMugShowcase active={active} onReady={onReady} onError={onError} />
        </Suspense></ViewerErrorBoundary>}
        {!ready && <img className="sh-mug-fallback" src="/images/personalization/caneca-base.png" alt="Caneca preparada para personalização com a tua imagem" loading="lazy" width={1024} height={1024} />}
        <span className="sh-image-label">{ready ? "Arrasta para girar · demo 3D" : "Personalização · feita à tua medida"}</span>
        <div className="sh-studio-sticker"><strong>3 passos</strong><span>Para o teu</span></div>
      </div>
      <div className="sh-personalization-copy"><p className="sh-eyebrow">03 — Personalizados</p><h2 id="personalization-title">Uma prenda que<br />não existe em<br /><span className="sh-pink">nenhuma<br className="sh-desktop-break" /> prateleira.</span></h2><p className="sh-description">Adiciona uma fotografia, escreve um nome e escolhe a cor e a fonte. A prévia acompanha cada alteração.</p>
        <ol className="sh-personalization-steps">{steps.map(({ title, description, Icon }, index) => <li key={title}><span className="sh-step-index">0{index + 1}</span><Icon size={19} aria-hidden="true" /><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        <Link className="sh-button" to="/personalizados">Começar a personalizar <ArrowUpRight size={15} /></Link>
      </div>
    </div></section>
  )
}
