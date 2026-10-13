import { useEffect, type ComponentRef, type RefObject } from "react"
import { useThree } from "@react-three/fiber"
import type { OrbitControls } from "@react-three/drei"
import { Raycaster, Vector2 } from "three"
import type { DesignStore } from "../editor/createDesignStore"
import { handleCursor, hitTest, hitTestHandle, unwrapDelta, uvToDesign, type TransformHandle } from "../editor/geometry"
import type { DesignPoint, PersonalizationElement } from "../editor/types"

type Controls = ComponentRef<typeof OrbitControls>
type Drag = { pointerId: number; id: string; initial: PersonalizationElement; handle: TransformHandle | null; start: DesignPoint; previousX: number; unwrappedX: number; offsetX: number; offsetY: number; controls: Controls }

export function useDesignInteraction(store: DesignStore, editing: boolean, controls: RefObject<Controls | null>, onInteraction: () => void) {
  const { gl, camera, scene, invalidate } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    let drag: Drag | null = null
    const suppressedPointers = new Set<number>()

    function pick(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      scene.updateMatrixWorld()
      camera.updateMatrixWorld()
      raycaster.setFromCamera(pointer, camera)
      // The nearest physical surface wins. The handle/shell can occlude the print;
      // the overlay's no-op raycast never contributes an intersection.
      const hit = raycaster.intersectObjects(scene.children, true)[0]
      return hit?.object.name === "printable-surface" && hit.uv ? uvToDesign(hit.uv) : null
    }
    function stop(event: PointerEvent) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    function finish() {
      if (!drag) return
      const finished = drag
      drag = null
      finished.controls.enabled = true
      if (canvas.hasPointerCapture(finished.pointerId)) canvas.releasePointerCapture(finished.pointerId)
      canvas.style.cursor = "grab"
      store.commit()
      invalidate()
    }
    function down(event: PointerEvent) {
      if (drag) { suppressedPointers.add(event.pointerId); stop(event); return }
      if (!editing || !event.isPrimary || event.button !== 0) return
      onInteraction()
      const point = pick(event)
      if (!point) return
      const design = store.getDesign()
      const selected = design.elements.find(element => element.id === design.selectedElementId)
      const handle = selected ? hitTestHandle(selected, point, event.pointerType !== "mouse") : null
      const element = handle ? selected : hitTest(design.elements, point)
      store.select(element?.id ?? null)
      const orbit = controls.current
      if (!element || !orbit) return
      stop(event)
      orbit.autoRotate = false
      orbit.enabled = false
      store.begin()
      drag = { pointerId: event.pointerId, id: element.id, initial: { ...element }, handle, start: point, previousX: point.x, unwrappedX: point.x,
        offsetX: point.x - element.x, offsetY: point.y - element.y, controls: orbit }
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = "grabbing"
    }
    function move(event: PointerEvent) {
      if (suppressedPointers.has(event.pointerId)) { stop(event); return }
      if (drag && drag.pointerId === event.pointerId) {
        stop(event)
        const point = pick(event)
        if (!point) return // Off the visible print: hold the last valid position.
        drag.unwrappedX += unwrapDelta(point.x, drag.previousX)
        drag.previousX = point.x
        if (drag.handle) store.transform(drag.initial, drag.handle, drag.start, { x: drag.unwrappedX, y: point.y })
        else store.move(drag.id, drag.unwrappedX - drag.offsetX, point.y - drag.offsetY)
      } else if (event.target === canvas && event.pointerType === "mouse") {
        const point = editing && !event.buttons ? pick(event) : null
        const design = store.getDesign()
        const selected = design.elements.find(element => element.id === design.selectedElementId)
        const handle = selected && point ? hitTestHandle(selected, point) : null
        canvas.style.cursor = event.buttons ? "grabbing" : handle ? handleCursor(handle) : point && hitTest(design.elements, point) ? "move" : "grab"
      }
    }
    function up(event: PointerEvent) {
      if (suppressedPointers.delete(event.pointerId)) { stop(event); return }
      if (drag?.pointerId === event.pointerId) { stop(event); finish() }
    }
    function lostCapture(event: PointerEvent) { if (drag?.pointerId === event.pointerId) finish() }
    function blur() { finish(); suppressedPointers.clear() }
    // Capture runs before OrbitControls' native pointerdown listener. A React
    // state update alone would disable controls too late for the same event.
    canvas.addEventListener("pointerdown", down, true)
    window.addEventListener("pointermove", move, { capture: true, passive: false })
    window.addEventListener("pointerup", up, true)
    window.addEventListener("pointercancel", up, true)
    canvas.addEventListener("lostpointercapture", lostCapture)
    window.addEventListener("blur", blur)
    return () => {
      finish()
      suppressedPointers.clear()
      canvas.style.cursor = ""
      canvas.removeEventListener("pointerdown", down, true)
      window.removeEventListener("pointermove", move, true)
      window.removeEventListener("pointerup", up, true)
      window.removeEventListener("pointercancel", up, true)
      canvas.removeEventListener("lostpointercapture", lostCapture)
      window.removeEventListener("blur", blur)
    }
  }, [store, editing, controls, onInteraction, gl, camera, scene, invalidate])
}
