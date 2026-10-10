import { Heart } from "lucide-react"

const stories = [
  { title: "Uma fotografia especial", text: "Uma imagem pode guardar uma viagem, uma pessoa ou um momento. Escolhe a tua e transforma-a numa prenda.", product: "Caneca personalizada", initial: "C" },
  { title: "Uma memória por perto", text: "Há fotografias que merecem sair do telemóvel. Dá-lhes um lugar no dia a dia de quem mais gostas.", product: "Fotopresente", initial: "F" },
  { title: "Um detalhe só teu", text: "Um nome, uma data ou uma pequena mensagem. São os detalhes pessoais que dão significado a uma prenda.", product: "Presente personalizado", initial: "P" },
]
export default function Testimonials() {
  return <section className="sh-container sh-section sh-testimonials" aria-labelledby="stories-title"><div className="sh-section-heading"><div><p className="sh-eyebrow">07 — Histórias para guardar</p><h2 id="stories-title">Prendas que ficam na memória.</h2></div></div><div className="sh-testimonial-grid">{stories.map(story => <article key={story.title}><Heart size={19} className="sh-story-icon" aria-hidden="true" /><p>{story.text}</p><div className="sh-story-person"><span aria-hidden="true">{story.initial}</span><div><h3>{story.title}</h3><small>{story.product}</small></div></div></article>)}</div></section>
}
