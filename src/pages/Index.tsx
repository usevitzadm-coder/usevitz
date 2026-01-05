import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ValueProps from "@/components/home/ValueProps";
import ProductsCarousel from "@/components/home/ProductsCarousel";
import LooksProntos from "@/components/home/LooksProntos";
import Testimonials from "@/components/home/Testimonials";
import BrandStory from "@/components/home/BrandStory";

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
        <LooksProntos />
        <FeaturedProducts />
        <BrandStory />
        <Testimonials />
      </Layout>
    </>
  );
};

export default Index;
