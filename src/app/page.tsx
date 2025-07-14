import Nav from '@/components/Nav'
import FloatSocial from '@/components/FloatSocial'
import FloatMail from '@/components/FloatMail'
import Hero from '@/components/Hero'
import AboutMe from '@/components/AboutMe'
import MyWork from '@/components/MyWork'
import FeaturedProjects from '@/components/FeaturedProjects'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <FloatSocial />
        <FloatMail />
        <Hero />
        <AboutMe />
        <MyWork />
        <FeaturedProjects />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
