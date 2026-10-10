import Hero from "../components/home/Hero"
import Categories from "../components/home/Categories"
import FeaturedProducts from "../components/home/FeaturedProducts"
import PersonalizationSection from "../components/home/PersonalizationSection"
import Testimonials from "../components/home/Testimonials"
import FAQ from "../components/home/FAQ"
import Benefits from "../components/home/Benefits"
import { HowItWorks, Occasions, Editorial, Inspiration } from "../components/home/EditorialSections"

export default function Home() {
  return (
    <div className="sh-home">
      <Hero />
      <Categories />
      <FeaturedProducts />
      <PersonalizationSection />
      <HowItWorks />
      <Occasions />
      <Editorial />
      <Benefits />
      <Testimonials />
      <Inspiration />
      <FAQ />
    </div>
  )
}
