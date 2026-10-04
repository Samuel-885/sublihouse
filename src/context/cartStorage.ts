import type { CartItem, ProductCustomization } from "./CartContext"
import type { Product } from "../types/product"

const STORAGE_KEY = "sublime-house-cart"

export function isValidQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isCustomization(value: unknown): value is ProductCustomization {
  return isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.color === "string" &&
    typeof value.font === "string" &&
    (value.imageName === undefined || typeof value.imageName === "string")
}

type StoredItem = Product & {
  cartItemId?: string
  quantity: number
  customization?: ProductCustomization
}

function isStoredItem(value: unknown): value is StoredItem {
  return isRecord(value) &&
    isValidQuantity(value.id) &&
    typeof value.name === "string" && value.name.trim().length > 0 &&
    typeof value.price === "number" && Number.isFinite(value.price) && value.price >= 0 &&
    typeof value.category === "string" &&
    typeof value.color === "string" &&
    typeof value.customizable === "boolean" &&
    typeof value.onSale === "boolean" &&
    (value.badge === undefined || typeof value.badge === "string") &&
    (value.image === undefined || typeof value.image === "string") &&
    (value.imageAlt === undefined || typeof value.imageAlt === "string") &&
    isValidQuantity(value.quantity) &&
    Number.isFinite(value.price * value.quantity) &&
    (value.cartItemId === undefined || typeof value.cartItemId === "string") &&
    (value.customization === undefined || isCustomization(value.customization))
}

export function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    // Descartar entradas inválidas sem perder as restantes linhas válidas.
    const validItems = parsed.filter(isStoredItem)
    const usedIds = new Set(validItems.map((item) => `product-${item.id}`))
    const cart: CartItem[] = []

    validItems.forEach((item, index) => {
      if (!item.customization) {
        const existing = cart.find((line) => line.id === item.id && !line.customization)
        if (existing) {
          const quantity = existing.quantity + item.quantity
          if (isValidQuantity(quantity) && Number.isFinite(existing.price * quantity)) {
            existing.quantity = quantity
          }
          return
        }
        cart.push({ ...item, cartItemId: `product-${item.id}` })
        return
      }

      // Cada personalização mantém uma linha própria, mesmo em dados antigos
      // ou quando dois itens persistidos têm o mesmo identificador.
      const baseId = item.cartItemId?.trim() || `custom-${item.id}-${index}`
      let cartItemId = baseId
      let suffix = 1
      while (usedIds.has(cartItemId)) cartItemId = `${baseId}-${suffix++}`
      usedIds.add(cartItemId)
      cart.push({ ...item, cartItemId })
    })

    return cart
  } catch {
    return []
  }
}

export function saveCart(cartItems: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  } catch {
    // O carrinho continua a funcionar em memória quando o armazenamento falha.
  }
}
