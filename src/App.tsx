import { Route, Routes } from "react-router"

import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"

import Home from "./pages/Home"
import Products from "./pages/Products"
import ProductDetails from "./pages/ProductDetails"
import Cart from "./pages/Cart"
import Personalizer from "./pages/Personalizer"

function App() {
  return (
    <>
      <Header />

      <main>
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
        </Routes>
      </main>

      <Footer />
    </>
  )
}

export default App