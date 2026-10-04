type ProductArtworkProps = { productId: number; color: string; className?: string }

// Ilustrações locais usadas enquanto as fotografias dos produtos não estão disponíveis.
function ProductArtwork({ productId, color, className = "" }: ProductArtworkProps) {
  const isMug = [1, 2, 5, 7].includes(productId)
  return (
    <svg viewBox="0 0 360 320" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="180" cy="290" rx="110" ry="9" fill="#0A0A0A" opacity=".07" />
      {isMug ? <>
        <path d="M258 102h18c61 0 61 108 0 108h-18v-24h18c28 0 28-59 0-59h-18" fill="#fff" stroke="#0A0A0A" strokeWidth="3" />
        <path d="M84 83h177v141c0 32-29 51-88 51s-89-19-89-51V83Z" fill="#fff" stroke="#0A0A0A" strokeWidth="3" />
        <ellipse cx="172.5" cy="83" rx="88.5" ry="18" fill="#F2F4F6" stroke="#0A0A0A" strokeWidth="3" />
        <ellipse cx="172" cy="83" rx="70" ry="8" fill={color} opacity=".16" />
        <path d="M108 110v112c0 16 9 24 22 29" stroke="#F2F4F6" strokeWidth="12" strokeLinecap="round" />
        <path d="m167 145 7-10 7 10 12 3-8 10 1 12-12-4-11 4 1-12-8-10 11-3Z" fill={color} />
        <text x="173" y="210" textAnchor="middle" fill={color} fontFamily="Fredoka, sans-serif" fontSize="39" fontWeight="600">{productId === 5 ? "Portugal" : "Sofia"}</text>
        <text x="173" y="232" textAnchor="middle" fill="#565B62" fontFamily="Figtree, sans-serif" fontSize="8" letterSpacing="3">FEITA PARA TI</text>
      </> : productId === 6 ? <>
        <rect x="95" y="40" width="184" height="244" rx="8" fill="#fff" stroke="#0A0A0A" strokeWidth="3" />
        <rect x="86" y="33" width="184" height="244" rx="8" fill={color} stroke="#0A0A0A" strokeWidth="3" />
        <rect x="106" y="33" width="6" height="244" fill="#0A0A0A" opacity=".14" />
        <rect x="136" y="86" width="104" height="130" rx="2" fill="#fff" />
        <path d="m181 105 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#E31C79" />
        <text x="188" y="171" textAnchor="middle" fill="#4B2E93" fontFamily="Fredoka, sans-serif" fontSize="30" fontWeight="600">Sofia</text>
        <text x="188" y="195" textAnchor="middle" fill="#565B62" fontFamily="Figtree, sans-serif" fontSize="8" letterSpacing="1.5">IDEIAS SEM FIM</text>
        <path d="M252 36v239" stroke="#0A0A0A" strokeWidth="7" opacity=".6" />
      </> : productId === 4 || productId === 8 ? <>
        {productId === 4 && <><circle cx="180" cy="67" r="29" stroke="#0A0A0A" strokeWidth="5" /><path d="M180 88v36" stroke="#0A0A0A" strokeWidth="5" /></>}
        <rect x="102" y={productId === 4 ? 119 : 70} width="156" height="150" rx="24" fill="#fff" stroke="#0A0A0A" strokeWidth="3" />
        <circle cx="180" cy="180" r="43" fill={color} opacity=".14" />
        <text x="180" y="193" textAnchor="middle" fill={color} fontFamily="Fredoka, sans-serif" fontSize="32" fontWeight="600">Sofia</text>
      </> : <>
        <rect x="84" y="31" width="193" height="249" rx="4" fill="#fff" stroke="#0A0A0A" strokeWidth="3" />
        <rect x="100" y="48" width="161" height="170" fill="#EDF4FA" />
        <circle cx="218" cy="87" r="22" fill="#F2891C" />
        <path d="m100 178 49-54 53 66 31-29 28 25v32H100v-40Z" fill={color} />
        <path d="m100 205 66-53 56 66H100v-13Z" fill="#4B2E93" />
        <text x="180" y="254" textAnchor="middle" fill="#0A0A0A" fontFamily="Fredoka, sans-serif" fontSize="23">O nosso momento.</text>
      </>}
    </svg>
  )
}

export default ProductArtwork
