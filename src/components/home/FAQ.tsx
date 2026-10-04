import { useState } from "react"

const questions = [
  {
    id: 1,
    question: "Como funciona a personalização?",
    answer:
      "Escolhes o produto, adicionas os elementos disponíveis para personalização e acompanhas a prévia antes de o adicionar ao carrinho.",
  },
  {
    id: 2,
    question: "Posso usar a minha própria fotografia?",
    answer:
      "Sim. Nos produtos compatíveis podes adicionar a tua própria fotografia durante o processo de personalização.",
  },
  {
    id: 3,
    question: "Quanto tempo demora a produção?",
    answer:
      "Os prazos de produção dependem do produto escolhido e dos detalhes da personalização.",
  },
  {
    id: 4,
    question: "Fazem envios para todo Portugal?",
    answer:
      "As informações sobre destinos, opções de envio e custos estarão disponíveis em breve.",
  },
]

function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  function handleQuestionClick(id: number) {
    setOpenQuestion(openQuestion === id ? null : id)
  }

  return (
    <section id="perguntas-frequentes" className="border-y border-orange/10 bg-orange/5">
      <div className="mx-auto grid max-w-360 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-18 lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet">
            Perguntas frequentes
          </p>

          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Antes de encomendar.
          </h2>

          <p className="mt-4 max-w-md leading-7 text-slate">
            As respostas para algumas das dúvidas mais comuns sobre
            personalização, produção e envio.
          </p>
        </div>

        <div className="border-t border-line">
          {questions.map((item) => {
            const isOpen = openQuestion === item.id

            return (
              <div
                key={item.id}
                className="border-b border-line"
              >
                <button
                  type="button"
                  onClick={() => handleQuestionClick(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-semibold">
                    {item.question}
                  </span>

                  <span aria-hidden="true" className={`text-2xl font-light transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>

                <div id={`faq-answer-${item.id}`} aria-hidden={!isOpen} className={`faq-answer ${isOpen ? "is-open" : ""}`}>
                  <div className="min-h-0 overflow-hidden"><p className="max-w-2xl pb-6 pr-10 leading-7 text-slate">
                    {item.answer}
                  </p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQ
