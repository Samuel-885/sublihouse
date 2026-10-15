import MugModel from "./MugModel"
import { useDesignTextures } from "./useDesignTextures"
import type { DesignStore } from "../editor/createDesignStore"
import type { Personalizer3DConfig } from "./personalizer3dConfig"
import type { MugVariant } from "../mugVariants"

export default function ProductModel({ config, store, variant }: { variant: MugVariant; config: Personalizer3DConfig; store: DesignStore }) {
  const textures = useDesignTextures(store)

  switch (config.kind) {
    case "mug": return <MugModel variant={variant} texture={textures.art} selectionTexture={textures.selection} />
  }
}
