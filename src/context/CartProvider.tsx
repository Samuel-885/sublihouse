import { useEffect, useState, type ReactNode } from "react"
import type { Product } from "../types/product"
import { isValidQuantity, readCart, saveCart } from "./cartStorage"
import {
  CartContext,
  type CartItem,
  type ProductCustomization,
} from "./CartContext"

type CartProviderProps = {
  children: ReactNode
}

function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(readCart)

  useEffect(() => {
    saveCart(cartItems)
  }, [cartItems])

  function addToCart(
    product: Product,
    quantity: number,
    customization?: ProductCustomization
  ) {
    if (!isValidQuantity(quantity) || !Number.isFinite(product.price * quantity)) return

    const customizationId = customization ? crypto.randomUUID() : undefined
    setCartItems((currentItems) => {
      // Produto personalizado sempre cria uma linha nova
      if (customization) {
        const customizedItem: CartItem = {
          ...product,
          cartItemId: customizationId!,
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
        const nextQuantity = existingItem.quantity + quantity
        if (!isValidQuantity(nextQuantity) || !Number.isFinite(existingItem.price * nextQuantity)) {
          return currentItems
        }
        return currentItems.map((item) =>
          item.cartItemId === existingItem.cartItemId
            ? {
                ...item,
                quantity: nextQuantity,
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
    if (!isValidQuantity(quantity)) {
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cartItemId === cartItemId && Number.isFinite(item.price * quantity)
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
