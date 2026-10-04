import { useEffect } from "react"
import { useReducedMotion } from "../hooks/useReducedMotion"
import Hero from "../components/home/Hero"
import Categories from "../components/home/Categories"
import FeaturedProducts from "../components/home/FeaturedProducts"
import PersonalizationSection from "../components/home/PersonalizationSection"
import Testimonials from "../components/home/Testimonials"
import FAQ from "../components/home/FAQ"
import Benefits from "../components/home/Benefits"



function Home() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const sections = document.querySelectorAll("main > section:not(.hero-carousel)")
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending")
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })
    sections.forEach((section) => {
      section.classList.add("reveal-section")
      if (section.getBoundingClientRect().top >= window.innerHeight) section.classList.add("reveal-pending")
      observer.observe(section)
    })
    return () => {
      observer.disconnect()
      sections.forEach((section) => section.classList.remove("reveal-section", "reveal-pending"))
    }
  }, [reducedMotion])

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
