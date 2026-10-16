import { useEffect, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useTexture } from "@react-three/drei"
import { CanvasTexture, DataTexture, SRGBColorSpace } from "three"
import MugModel from "../personalizer/3d/MugModel"
import { defaultMugVariant } from "../personalizer/mugVariants"
import { useWebGLSupport } from "../personalizer/3d/useWebGLSupport"
import { useReducedMotion } from "../../hooks/useReducedMotion"

type ShowcaseProps = { active: boolean; onReady: () => void; onError: () => void }

function ShowcaseContent({ active, onReady, onError }: ShowcaseProps) {
  const logo = useTexture("/images/brand/sublihouse-logo.png")
  const gl = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  const reducedMotion = useReducedMotion()
  const [interacted, setInteracted] = useState(false)
  const autoRotate = active && !reducedMotion && !interacted
  const textures = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 512
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Não foi possível preparar a arte da caneca.")
    // Compensate for the existing cylinder's circumference/height UV ratio.
    // The official image remains intact and is centred on the front of the mug.
    context.drawImage(logo.image as HTMLImageElement, 352, 96, 320, 320)
    const art = new CanvasTexture(canvas)
    art.colorSpace = SRGBColorSpace
    art.anisotropy = 4
    // MugModel expects an overlay map; a transparent pixel keeps it invisible.
    const selection = new DataTexture(new Uint8Array(4), 1, 1)
    selection.needsUpdate = true
    return { art, selection }
  }, [logo])

  useEffect(() => () => {
    textures.art.dispose()
    textures.selection.dispose()
  }, [textures])

  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onError() }
    canvas.addEventListener("webglcontextlost", lost)
    onReady()
    return () => canvas.removeEventListener("webglcontextlost", lost)
  }, [gl, onReady, onError])

  useEffect(() => { if (active) invalidate() }, [active, invalidate])
  useFrame(() => { if (autoRotate) invalidate() })

  return <>
    <hemisphereLight args={["#ffffff", "#c9c2b5", 2.1]} />
    <directionalLight position={[3, 5, 4]} intensity={2.6} />
    <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#fff1e7" />
    <group rotation={[0, 0.35, 0]}>
      <MugModel variant={defaultMugVariant} texture={textures.art} selectionTexture={textures.selection} />
    </group>
    <mesh position={[0, -1.22, 0]}>
      <cylinderGeometry args={[1.65, 1.7, 0.2, 64]} />
      <meshStandardMaterial color="#c99d65" roughness={0.95} />
    </mesh>
    <OrbitControls makeDefault target={[0.24, -0.08, 0]} enablePan={false} enableZoom={false}
      enableDamping dampingFactor={0.08} rotateSpeed={0.65}
      minPolarAngle={0.65} maxPolarAngle={1.55}
      autoRotate={autoRotate} autoRotateSpeed={0.3} onStart={() => setInteracted(true)} />
  </>
}

export default function HomeMugShowcase(props: ShowcaseProps) {
  const supported = useWebGLSupport(true)
  useEffect(() => { if (!supported) props.onError() }, [supported, props.onError])
  if (!supported) return null

  return <div className="sh-mug-canvas" role="img" aria-label="Caneca 3D com a arte Sublime House. Arrasta com o rato ou o dedo para girar.">
    <Canvas camera={{ position: [2.2, 1.6, 5], fov: 35, near: 0.1, far: 40 }}
      dpr={[1, 1.5]} frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}>
      <ShowcaseContent {...props} />
    </Canvas>
  </div>
}
