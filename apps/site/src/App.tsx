import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ModelsSection } from './components/ModelsSection'
import { AboutSection } from './components/AboutSection'
import { TestimonialsSection } from './components/TestimonialsSection'
import { Footer } from './components/Footer'
import { WhatsAppButton } from './components/WhatsAppButton'

function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main>
        <Hero />
        <ModelsSection />
        <AboutSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default App
