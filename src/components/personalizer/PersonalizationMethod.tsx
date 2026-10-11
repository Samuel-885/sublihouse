import { ArrowRight, MessageCircle, Plus } from "lucide-react"
import { createWhatsAppUrl } from "../../data/contact"

export default function PersonalizationMethod({ productName, onStart }: { productName: string; onStart: () => void }) {
  return <section className="pz-method" aria-labelledby="pz-method-title">
    <h3 id="pz-method-title">Como queres personalizar?</h3>
    <div className="pz-method-option">
      <p>Cria diretamente na peça e acompanha cada alteração à medida que personalizas.</p>
      <button type="button" className="pz-button pz-button-primary" onClick={onStart}><Plus size={15} /> Criar agora <ArrowRight size={15} /></button>
      <span className="pz-method-note">Ferramentas de criação disponíveis em breve.</span>
    </div>
    <div className="pz-method-divider"><span>ou</span></div>
    <div className="pz-method-option">
      <h4>Enviar a minha ideia</h4><p>Prefere que tratemos da criação? Envia fotografias, nomes e indicações pelo WhatsApp.</p>
      <a className="pz-button" href={createWhatsAppUrl(`Olá! Quero personalizar ${productName}. Gostaria de enviar a minha ideia, fotografias e instruções.`)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Enviar pelo WhatsApp <ArrowRight size={15} /></a>
    </div>
  </section>
}
