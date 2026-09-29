import { Route, Routes } from "react-router"

import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"

import Home from "./pages/Home"
import Products from "./pages/Products"

function App() {
  return (
    <>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </main>

      <Footer />
    </>
  )
}

export default App