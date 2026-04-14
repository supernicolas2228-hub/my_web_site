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
import SeoDirections from "@/components/SeoDirections";
import SignupPrompt from "@/components/SignupPrompt";
import { getReviewsForHome } from "@/lib/reviews";
import type { Metadata } from "next";

/** Случайный поднабор отзывов в карусели — не кэшировать страницу как статику. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Создание сайтов и Telegram‑ботов под ключ",
  description:
    "TrueWeb: создание сайтов, лендингов и интернет‑магазинов, разработка Telegram‑ботов. Цены на сайте, запуск и поддержка.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "TrueWeb — создание сайтов и Telegram‑ботов под ключ",
    description:
      "Студия веб‑разработки: сайты под ключ и чат‑боты в Telegram. Прозрачные сроки и сопровождение после запуска."
  }
};

export default async function HomePage() {
  const { total, carousel } = getReviewsForHome();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <SeoDirections />
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
