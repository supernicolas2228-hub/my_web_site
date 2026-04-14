import Advantages from "@/components/Advantages";
import About from "@/components/About";
import Contacts from "@/components/Contacts";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Portfolio from "@/components/Portfolio";
import Pricing from "@/components/Pricing";
import Reviews from "@/components/Reviews";
import SignupPrompt from "@/components/SignupPrompt";
import { getReviewsForHome } from "@/lib/reviews";

/** Случайный поднабор отзывов в карусели — не кэшировать страницу как статику. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { total, carousel } = getReviewsForHome();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Pricing />
        <Reviews carousel={carousel} total={total} />
        <Portfolio />
        <Advantages />
        <Faq />
        <Contacts />
      </main>
      <Footer />
      {/* После контента: сначала видны услуги и кнопки, предложение аккаунта — позже и ниже по слою */}
      <SignupPrompt />
    </>
  );
}
