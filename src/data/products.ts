import { Product, Collection } from "@/types/product";
import productLegging1 from "@/assets/product-legging-1.jpg";
import productTop1 from "@/assets/product-top-1.jpg";
import productLegging2 from "@/assets/product-legging-2.jpg";
import productTop2 from "@/assets/product-top-2.jpg";
import collectionFeminino from "@/assets/collection-feminino.jpg";
import collectionMasculino from "@/assets/collection-masculino.jpg";

export const products: Product[] = [
  {
    id: "1",
    name: "Legging Seamless Essential",
    slug: "legging-seamless-essential",
    description: "Nossa legging seamless oferece suporte máximo com tecnologia de compressão graduada. O tecido de alta performance se adapta ao seu corpo, proporcionando liberdade total de movimento. Ideal para treinos intensos e yoga.",
    shortDescription: "Legging de alta compressão com tecnologia seamless",
    price: 189.90,
    originalPrice: 239.90,
    images: [productLegging1, productLegging1, productLegging1],
    category: "feminino",
    subcategory: "leggings",
    variants: [
      { id: "1-pp-preto", size: "PP", color: "Preto", colorHex: "#1a1a1a", stock: 15, sku: "LEG-ESS-PP-BLK" },
      { id: "1-p-preto", size: "P", color: "Preto", colorHex: "#1a1a1a", stock: 20, sku: "LEG-ESS-P-BLK" },
      { id: "1-m-preto", size: "M", color: "Preto", colorHex: "#1a1a1a", stock: 18, sku: "LEG-ESS-M-BLK" },
      { id: "1-g-preto", size: "G", color: "Preto", colorHex: "#1a1a1a", stock: 12, sku: "LEG-ESS-G-BLK" },
      { id: "1-gg-preto", size: "GG", color: "Preto", colorHex: "#1a1a1a", stock: 8, sku: "LEG-ESS-GG-BLK" },
    ],
    benefits: [
      "Tecnologia seamless sem costuras",
      "Compressão graduada para suporte muscular",
      "Tecido com proteção UV50+",
      "Secagem ultra-rápida",
      "Cintura alta modeladora",
    ],
    badge: "mais-vendido",
    rating: 4.9,
    reviewCount: 127,
    sizeGuide: "PP: 34-36 | P: 36-38 | M: 38-40 | G: 40-42 | GG: 42-44",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Top Esportivo Breathe",
    slug: "top-esportivo-breathe",
    description: "Top esportivo com suporte médio, perfeito para yoga, pilates e treinos moderados. O design racerback oferece total liberdade de movimento enquanto o tecido respirável mantém você fresca.",
    shortDescription: "Top com suporte médio e tecido ultra respirável",
    price: 129.90,
    images: [productTop1, productTop1, productTop1],
    category: "feminino",
    subcategory: "tops",
    variants: [
      { id: "2-pp-verde", size: "PP", color: "Verde Sage", colorHex: "#afd4c3", stock: 10, sku: "TOP-BRE-PP-GRN" },
      { id: "2-p-verde", size: "P", color: "Verde Sage", colorHex: "#afd4c3", stock: 15, sku: "TOP-BRE-P-GRN" },
      { id: "2-m-verde", size: "M", color: "Verde Sage", colorHex: "#afd4c3", stock: 20, sku: "TOP-BRE-M-GRN" },
      { id: "2-g-verde", size: "G", color: "Verde Sage", colorHex: "#afd4c3", stock: 12, sku: "TOP-BRE-G-GRN" },
    ],
    benefits: [
      "Suporte médio confortável",
      "Tecido ultra respirável",
      "Design racerback",
      "Bojo removível",
      "Acabamento premium",
    ],
    badge: "novo",
    rating: 4.8,
    reviewCount: 45,
    sizeGuide: "PP: 34-36 | P: 36-38 | M: 38-40 | G: 40-42",
    createdAt: "2024-12-01",
  },
  {
    id: "3",
    name: "Legging Power Sculpt",
    slug: "legging-power-sculpt",
    description: "A legging Power Sculpt foi desenvolvida para quem busca máxima performance e estilo. Com tecnologia de compressão estratégica, ela esculpe e valoriza seu corpo naturalmente.",
    shortDescription: "Legging modeladora com compressão estratégica",
    price: 219.90,
    images: [productLegging2, productLegging2, productLegging2],
    category: "feminino",
    subcategory: "leggings",
    variants: [
      { id: "3-pp-vinho", size: "PP", color: "Vinho", colorHex: "#722F37", stock: 8, sku: "LEG-PWR-PP-WIN" },
      { id: "3-p-vinho", size: "P", color: "Vinho", colorHex: "#722F37", stock: 14, sku: "LEG-PWR-P-WIN" },
      { id: "3-m-vinho", size: "M", color: "Vinho", colorHex: "#722F37", stock: 16, sku: "LEG-PWR-M-WIN" },
      { id: "3-g-vinho", size: "G", color: "Vinho", colorHex: "#722F37", stock: 10, sku: "LEG-PWR-G-WIN" },
    ],
    benefits: [
      "Compressão estratégica modeladora",
      "Cós extra alto para conforto",
      "Não marca",
      "Tecido antibacteriano",
      "Elasticidade em 4 direções",
    ],
    badge: "promo",
    rating: 4.7,
    reviewCount: 89,
    sizeGuide: "PP: 34-36 | P: 36-38 | M: 38-40 | G: 40-42",
    createdAt: "2024-06-20",
  },
  {
    id: "4",
    name: "Top Cropped Cloud",
    slug: "top-cropped-cloud",
    description: "O Top Cropped Cloud é a peça perfeita para treinos leves e uso casual. Seu tecido macio como uma nuvem oferece conforto incomparável durante todo o dia.",
    shortDescription: "Top cropped ultra macio para uso casual e treinos",
    price: 99.90,
    images: [productTop2, productTop2, productTop2],
    category: "feminino",
    subcategory: "tops",
    variants: [
      { id: "4-pp-branco", size: "PP", color: "Branco", colorHex: "#ffffff", stock: 20, sku: "TOP-CLD-PP-WHT" },
      { id: "4-p-branco", size: "P", color: "Branco", colorHex: "#ffffff", stock: 25, sku: "TOP-CLD-P-WHT" },
      { id: "4-m-branco", size: "M", color: "Branco", colorHex: "#ffffff", stock: 30, sku: "TOP-CLD-M-WHT" },
      { id: "4-g-branco", size: "G", color: "Branco", colorHex: "#ffffff", stock: 18, sku: "TOP-CLD-G-WHT" },
      { id: "4-gg-branco", size: "GG", color: "Branco", colorHex: "#ffffff", stock: 12, sku: "TOP-CLD-GG-WHT" },
    ],
    benefits: [
      "Tecido ultra macio",
      "Corte cropped moderno",
      "Versatilidade treino/casual",
      "Lavagem fácil",
      "Não desbota",
    ],
    rating: 4.6,
    reviewCount: 62,
    sizeGuide: "PP: 34-36 | P: 36-38 | M: 38-40 | G: 40-42 | GG: 42-44",
    createdAt: "2024-11-10",
  },
];

export const collections: Collection[] = [
  {
    id: "1",
    name: "Feminino",
    slug: "feminino",
    description: "Roupas fitness femininas que combinam estilo, conforto e performance",
    image: collectionFeminino,
  },
  {
    id: "2",
    name: "Masculino",
    slug: "masculino",
    description: "Roupas fitness masculinas para treinos de alta performance",
    image: collectionMasculino,
  },
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((p) => p.category === category);
};
