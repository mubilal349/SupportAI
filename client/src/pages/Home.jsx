import Navbar from "../components/common/Navbar";
import Hero from "../components/Home/Hero";
import Stats from "../components/Home/Stats";
import Features from "../components/Home/Features";
import HowItWorks from "../components/Home/HowItWorks";
import Testimonials from "../components/Home/Testimonials";
import CTA from "../components/Home/CTA";
import Footer from "../components/common/Footer";
import BackToTop from "../components/Home/BackToTop";

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main>
        <Hero />

        <Stats />

        <Features />

        <HowItWorks />

        <Testimonials />

        <CTA />
      </main>

      <Footer />

      <BackToTop />
    </div>
  );
};

export default Home;
