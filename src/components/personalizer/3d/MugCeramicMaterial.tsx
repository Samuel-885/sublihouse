import { useCallback, useLayoutEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import { Color, type MeshStandardMaterial } from "three"
import type { MugVariant } from "../mugVariants"

const programCacheKey = () => "mug-ceramic-dots-v1"

export default function MugCeramicMaterial({ variant }: { variant: MugVariant }) {
  const invalidate = useThree(state => state.invalidate)
  const uniforms = useRef({
    mugDots: { value: 0 },
    mugDotColor: { value: new Color() },
  })

  useLayoutEffect(() => {
    uniforms.current.mugDots.value = variant.pattern?.kind === "dots" ? 1 : 0
    uniforms.current.mugDotColor.value.set(variant.pattern?.color ?? "#343438")
    invalidate()
  }, [variant, uniforms, invalidate])

  const compile = useCallback<MeshStandardMaterial["onBeforeCompile"]>(shader => {
    Object.assign(shader.uniforms, uniforms.current)
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMugPosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMugPosition = position;")
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vMugPosition;
        uniform float mugDots;
        uniform vec3 mugDotColor;
      `)
      .replace("#include <color_fragment>", `#include <color_fragment>
        // A whole number of columns closes the pattern at either angular seam.
        // Compute antialiasing from position, avoiding atan's discontinuity.
        if (mugDots > 0.5 && length(vMugPosition.xz) > 0.91 && abs(vMugPosition.y) < 1.04) {
          float column = atan(vMugPosition.x, vMugPosition.z) * (24.0 / 6.28318530718);
          float row = vMugPosition.y / (6.28318530718 * 0.94 / 24.0);
          vec2 cell = fract(vec2(column, row) + 0.5) - 0.5;
          float edge = max(length(fwidth(vMugPosition)) * (24.0 / 6.28318530718 / 0.94), 0.001);
          float dotMask = 1.0 - smoothstep(0.19 - edge, 0.19 + edge, length(cell));
          diffuseColor.rgb = mix(diffuseColor.rgb, mugDotColor, dotMask);
        }
      `)
  }, [uniforms])

  // One stable standard material/program. Pattern changes update uniforms only;
  // lighting is preserved and there is no extra texture or geometry to dispose.
  return <meshStandardMaterial color={variant.ceramicColor} roughness={0.25} metalness={0}
    onBeforeCompile={compile} customProgramCacheKey={programCacheKey} />
}
