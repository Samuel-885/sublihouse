import { useState } from "react"
import { Minus, Plus } from "lucide-react"

const questions = [
  { question: "Como funciona a personalização?", answer: "Escolhes o produto, adicionas os elementos disponíveis para personalização (foto, nome, cor, fonte) e acompanhas a prévia antes de adicionar ao carrinho." },
  { question: "Posso usar a minha própria fotografia?", answer: "Sim. Nos produtos compatíveis podes adicionar a tua própria fotografia durante o processo de personalização." },
  { question: "Quanto tempo demora a produção?", answer: "Os prazos dependem do produto e dos detalhes da personalização. Fala connosco antes de encomendar para confirmar o prazo da tua prenda." },
  { question: "Fazem envios para todo Portugal?", answer: "Contacta-nos para confirmar a disponibilidade, os custos e o prazo de envio para a tua morada." },
  { question: "Qual a qualidade da estampa?", answer: "O resultado depende do produto, do material e da qualidade da imagem enviada. Usa uma fotografia nítida e consulta-nos se precisares de ajuda a preparar o ficheiro." },
]
export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)
  return <section id="perguntas-frequentes" className="sh-faq" aria-labelledby="faq-title"><div className="sh-container sh-faq-grid"><div><p className="sh-eyebrow">09 — FAQ</p><h2 id="faq-title">Antes de<br className="sh-desktop-break" /> encomendar.</h2><p className="sh-description">Não encontraste a resposta? Fala connosco.</p><a className="sh-text-link sh-underlined" href="#contacto">Ir para o contacto ↗</a></div><div className="sh-faq-list">{questions.map((item, index) => <div className="sh-faq-item" key={item.question}><h3><button type="button" id={`home-question-${index}`} aria-expanded={openQuestion === index} aria-controls={`home-answer-${index}`} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>{item.question}{openQuestion === index ? <Minus size={17} className="sh-pink" aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}</button></h3><div id={`home-answer-${index}`} role="region" aria-labelledby={`home-question-${index}`} className={`sh-faq-answer ${openQuestion === index ? "is-open" : ""}`} aria-hidden={openQuestion !== index} inert={openQuestion !== index}><div><p>{item.answer}</p></div></div></div>)}</div></div></section>
}
