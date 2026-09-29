import Hero from "../components/home/Hero"
import Categories from "../components/home/Categories"
import FeaturedProducts from "../components/home/FeaturedProducts"
import PersonalizationSection from "../components/home/PersonalizationSection"
import Benefits from "../components/home/Benefits"
import FinalCTA from "../components/home/FinalCTA"


function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <PersonalizationSection />
      <Benefits />
      <FinalCTA />
    </>
  )
}

export default Home