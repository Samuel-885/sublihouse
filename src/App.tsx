import { lazy, Suspense } from "react"
import { Route, Routes, useLocation } from "react-router"

import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"

import Home from "./pages/Home"
import Products from "./pages/Products"
import ProductDetails from "./pages/ProductDetails"
import Cart from "./pages/Cart"
import Personalizados from "./pages/Personalizados"
import NotFound from "./pages/NotFound"
import FloatingWhatsApp from "./components/layout/FloatingWhatsApp"
import HomeHeader from "./components/home/HomeHeader"
import HomeFooter from "./components/home/HomeFooter"
import ScrollToTop from "./components/layout/ScrollToTop"
import "./components/home/home.css"

const Personalizer = lazy(() => import("./pages/Personalizer"))

function App() {
  const { pathname } = useLocation()
  const usesEditorialLayout = pathname === "/" || /^\/personalizados\/?$/.test(pathname) || /^\/cart\/?$/.test(pathname) || pathname === "/products" || /^\/products\/[^/]+\/?$/.test(pathname) || /^\/personalize\/[^/]+\/?$/.test(pathname)

  return (
    <>
      <ScrollToTop />
      {usesEditorialLayout ? <HomeHeader /> : <Header />}

      <main key={pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/personalizados" element={<Personalizados />} />
          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/personalize/:id"
            element={<Suspense fallback={<div className="min-h-screen p-8" role="status">A carregar o personalizador…</div>}><Personalizer /></Suspense>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {usesEditorialLayout ? <HomeFooter /> : <Footer />}
      
      <FloatingWhatsApp />
    </>
  )
}

export default App
