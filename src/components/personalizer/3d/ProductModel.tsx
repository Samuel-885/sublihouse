import { useEffect, useMemo } from "react"
import MugModel from "./MugModel"
import { createDemoTexture } from "./createDemoTexture"
import type { Personalizer3DConfig } from "./personalizer3dConfig"

export default function ProductModel({ config }: { config: Personalizer3DConfig }) {
  const texture = useMemo(() => createDemoTexture(config.printableArea), [config])
  // Three can re-upload a disposed texture during StrictMode's effect replay.
  useEffect(() => () => texture.dispose(), [texture])

  switch (config.kind) {
    case "mug": return <MugModel texture={texture} />
  }
}
