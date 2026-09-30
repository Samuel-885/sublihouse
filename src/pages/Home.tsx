import Hero from "../components/home/Hero"
import Categories from "../components/home/Categories"
import FeaturedProducts from "../components/home/FeaturedProducts"
import PersonalizationSection from "../components/home/PersonalizationSection"
import Testimonials from "../components/home/Testimonials"
import FAQ from "../components/home/FAQ"
import Benefits from "../components/home/Benefits"



function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <PersonalizationSection />
      <Testimonials />
      <FAQ />
      <Benefits />
    </>
  )
}

export default Home