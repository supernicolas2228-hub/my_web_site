import Advantages from "@/components/Advantages";
import About from "@/components/About";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import Pricing from "@/components/Pricing";
import SignupPrompt from "@/components/SignupPrompt";

export default function HomePage() {
  return (
    <>
      <SignupPrompt />
      <Header />
      <main>
        <Hero />
        <About />
        <Pricing />
        <Advantages />
        <Portfolio />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
