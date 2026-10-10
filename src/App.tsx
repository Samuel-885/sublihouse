import { useEffect } from "react"
import { Route, Routes, useLocation } from "react-router"

import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"

import Home from "./pages/Home"
import Products from "./pages/Products"
import ProductDetails from "./pages/ProductDetails"
import Cart from "./pages/Cart"
import Personalizer from "./pages/Personalizer"
import NotFound from "./pages/NotFound"
import FloatingWhatsApp from "./components/layout/FloatingWhatsApp"
import HomeHeader from "./components/home/HomeHeader"
import HomeFooter from "./components/home/HomeFooter"
import "./components/home/home.css"

function App() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (hash) {
      return
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [pathname, hash, key])

  useEffect(() => {
    if (!hash) return
    let targetId: string
    try {
      targetId = decodeURIComponent(hash.slice(1))
    } catch {
      return
    }
    const frame = requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches

      document.getElementById(targetId)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash, key])

  return (
    <>
      {pathname === "/" ? <HomeHeader /> : <Header />}

      <main key={pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/personalize/:id"
            element={<Personalizer />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {pathname === "/" ? <HomeFooter /> : <Footer />}
      
      <FloatingWhatsApp />
    </>
  )
}

export default App
