import Header from "./components/layout/Header"
import Hero from "./components/home/Hero"
import Categories from "./components/home/Categories"
import FeaturedProducts from "./components/home/FeaturedProducts"
import PersonalizationSection from "./components/home/PersonalizationSection"
import Benefits from "./components/home/Benefits"
import FinalCTA from "./components/home/FinalCTA"
import Footer from "./components/layout/Footer"

function App() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <PersonalizationSection />
        <Benefits />
        <FinalCTA />
      </main>

      <Footer />
    </>
  )
}

export default App