import { mugVariants, type MugVariant } from "./mugVariants"

export default function MugVariantSelector({ variant, onChange, available }: {
  variant: MugVariant
  onChange: (variant: MugVariant) => void
  available: boolean
}) {
  return <section className="pz-product-appearance" aria-labelledby="pz-mug-color">
    <p className="pz-label">Produto</p>
    <h3 id="pz-mug-color">Cor da caneca</h3>
    <div className="pz-variants" role="group" aria-labelledby="pz-mug-color">
      {mugVariants.map(option => <button key={option.id} type="button" className="pz-variant"
        data-variant={option.id} aria-pressed={variant.id === option.id} disabled={!available}
        onClick={() => onChange(option)}>
        <span className="pz-variant-swatch" aria-hidden="true" style={{
          backgroundColor: option.ceramicColor,
          backgroundImage: option.pattern ? `radial-gradient(circle, ${option.pattern.color} 24%, transparent 27%)` : undefined,
          backgroundSize: option.pattern ? "9px 9px" : undefined,
        }} />
        <span>{option.label}</span>
      </button>)}
    </div>
  </section>
}
