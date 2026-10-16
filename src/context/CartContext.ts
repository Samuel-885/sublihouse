import { createContext } from "react"
import type { Product } from "../types/product"

type LegacyCustomization = {
  name: string
  color: string
  font: string
  imageName?: string
}

export type DesignCustomization = {
  variant: { id: string; label: string }
  design: { texts: string[]; photoCount: number }
  preview?: string
}

export type ProductCustomization = LegacyCustomization | DesignCustomization

export type CartItem = Product & {
  productId: number
  cartItemId: string
  quantity: number
  customization?: ProductCustomization
}

type CartContextType = {
  cartItems: CartItem[]
  totalItems: number
  cartTotal: number

  addToCart: (
    product: Product,
    quantity: number,
    customization?: ProductCustomization
  ) => void

  updateQuantity: (
    cartItemId: string,
    quantity: number
  ) => void

  removeFromCart: (cartItemId: string) => void
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
)
