export type MugVariant = {
  id: "white" | "black" | "yellow" | "dots"
  label: string
  ceramicColor: string
  handleColor: string
  pattern?: { kind: "dots"; color: string }
}

// Demonstration appearance only; never part of the customer's DesignStore.
export const mugVariants: readonly MugVariant[] = [
  { id: "white", label: "Branca", ceramicColor: "#fffdf9", handleColor: "#fffdf9" },
  { id: "black", label: "Preta", ceramicColor: "#252527", handleColor: "#252527" },
  { id: "yellow", label: "Amarela", ceramicColor: "#efb92f", handleColor: "#efb92f" },
  { id: "dots", label: "Bolinhas", ceramicColor: "#fffdf9", handleColor: "#fffdf9", pattern: { kind: "dots", color: "#343438" } },
]

export const defaultMugVariant = mugVariants[0]
