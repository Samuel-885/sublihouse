import { Vector2, type Texture } from "three"

// Closed ceramic cross-section: underside, outer wall, rounded lip,
// inner wall and inner floor. The handle and print have separate materials.
const profile = [
  [0, -1.12], [0.83, -1.12], [0.90, -1.10], [0.94, -1.04],
  [0.94, 1.04], [0.93, 1.09], [0.90, 1.11], [0.87, 1.09],
  [0.85, 1.04], [0.85, -0.92], [0.81, -0.98], [0, -0.98],
].map(([radius, height]) => new Vector2(radius, height))

export default function MugModel({ texture }: { texture: Texture | null }) {
  return <group name="mug">
    <mesh name="ceramic-shell">
      <latheGeometry args={[profile, 96]} />
      <meshStandardMaterial color="#fffdf9" roughness={0.25} metalness={0} />
    </mesh>
    <mesh name="printable-surface">
      {/* Continuous cylinder UVs, u/v in [0,1]. Seam at the back; no caps,
          lip, interior or handle in the print. Ready for future UV picking. */}
      <cylinderGeometry args={[0.942, 0.942, 1.94, 96, 1, true, -Math.PI]} />
      <meshStandardMaterial map={texture} color="#ffffff" roughness={0.3} metalness={0} />
    </mesh>
    <mesh name="ceramic-handle" position={[0.89, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1.25, 1, 1]}>
      <torusGeometry args={[0.59, 0.12, 12, 40, Math.PI]} />
      <meshStandardMaterial color="#fffdf9" roughness={0.25} metalness={0} />
    </mesh>
  </group>
}
