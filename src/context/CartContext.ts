import { createContext } from "react"
import type { Product } from "../types/product"

export type CartItem = Product & {
  quantity: number
}

type CartContextType = {
  cartItems: CartItem[]
  totalItems: number
  cartTotal: number

  addToCart: (product: Product, quantity: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
)