export const personalizationColors = [
  { name: "Rosa", value: "#E31C79" },
  { name: "Azul", value: "#0B84D1" },
  { name: "Laranja", value: "#F2891C" },
  { name: "Roxo", value: "#4B2E93" },
]

export function getPersonalizationColorName(value: string) {
  return personalizationColors.find((color) => color.value.toLowerCase() === value.toLowerCase())?.name ?? value
}
