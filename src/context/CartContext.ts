import { createContext } from "react"
import type { Product } from "../types/product"

export type ProductCustomization = {
  name: string
  color: string
  font: string
  imageName?: string
}

export type CartItem = Product & {
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