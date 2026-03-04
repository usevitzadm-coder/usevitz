import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import ValueProps from "@/components/home/ValueProps";
import ProductsCarousel from "@/components/home/ProductsCarousel";

// Lazy load below-the-fold sections to reduce initial JS parse time
const LooksProntos = lazy(() => import("@/components/home/LooksProntos"));
const GiftCardSection = lazy(() => import("@/components/home/GiftCardSection"));
const Testimonials = lazy(() => import("@/components/home/Testimonials"));
const BrandStory = lazy(() => import("@/components/home/BrandStory"));

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Vitz | Roupas Fitness Premium - Conforto, Performance e Estilo</title>
        <meta
          name="description"
          content="Vitz - Roupas fitness premium desenvolvidas para quem vive em movimento. Leggings, tops e conjuntos com tecnologia de ponta, conforto e estilo."
        />
        <meta name="keywords" content="roupas fitness, leggings, tops esportivos, moda fitness, roupas de treino, Vitz" />
        <link rel="canonical" href="https://www.usevitz.com" />
      </Helmet>
      <Layout>
        <HeroSection />
        <ValueProps />
        
        <ProductsCarousel />
        <Suspense fallback={null}>
          <LooksProntos />
          <GiftCardSection />
          <BrandStory />
          <Testimonials />
        </Suspense>
      </Layout>
    </>
  );
};

export default Index;
