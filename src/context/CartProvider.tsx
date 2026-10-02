import { useEffect, useState, type ReactNode } from "react"
import type { Product } from "../types/product"
import {
  CartContext,
  type CartItem,
  type ProductCustomization,
} from "./CartContext"

type CartProviderProps = {
  children: ReactNode
}

function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem("sublime-house-cart")

    if (!storedCart) {
      return []
    }

    try {
      return JSON.parse(storedCart)
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(
      "sublime-house-cart",
      JSON.stringify(cartItems)
    )
  }, [cartItems])

  function addToCart(
    product: Product,
    quantity: number,
    customization?: ProductCustomization
  ) {
    setCartItems((currentItems) => {
      // Produto personalizado sempre cria uma linha nova
      if (customization) {
        const customizedItem: CartItem = {
          ...product,
          cartItemId: crypto.randomUUID(),
          quantity,
          customization,
        }

        return [...currentItems, customizedItem]
      }

      // Produto pronto pode ser agrupado
      const existingItem = currentItems.find(
        (item) =>
          item.id === product.id &&
          !item.customization
      )

      if (existingItem) {
        return currentItems.map((item) =>
          item.cartItemId === existingItem.cartItemId
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        )
      }

      const newItem: CartItem = {
        ...product,
        cartItemId: `product-${product.id}`,
        quantity,
      }

      return [...currentItems, newItem]
    })
  }

  function updateQuantity(
    cartItemId: string,
    quantity: number
  ) {
    if (quantity < 1) {
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    )
  }

  function removeFromCart(cartItemId: string) {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.cartItemId !== cartItemId
      )
    )
  }

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider