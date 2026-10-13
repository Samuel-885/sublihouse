import MugModel from "./MugModel"
import { useDesignTextures } from "./useDesignTextures"
import type { DesignStore } from "../editor/createDesignStore"
import type { Personalizer3DConfig } from "./personalizer3dConfig"

export default function ProductModel({ config, store }: { config: Personalizer3DConfig; store: DesignStore }) {
  const textures = useDesignTextures(store)

  switch (config.kind) {
    case "mug": return <MugModel texture={textures.art} selectionTexture={textures.selection} />
  }
}
