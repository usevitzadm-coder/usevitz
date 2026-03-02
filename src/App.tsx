import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CollectionPage from "./pages/CollectionPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import CartPage from "./pages/CartPage";
import SearchPage from "./pages/SearchPage";
import ProductsPage from "./pages/ProductsPage";
import GiftCardPage from "./pages/GiftCardPage";
import CheckGiftCardPage from "./pages/CheckGiftCardPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutErrorPage from "./pages/CheckoutErrorPage";
import CheckoutPendingPage from "./pages/CheckoutPendingPage";
import AboutPage from "./pages/AboutPage";
import DeliveryPolicyPage from "./pages/DeliveryPolicyPage";
import ReturnsPage from "./pages/ReturnsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";
import AdminGiftCards from "./pages/admin/AdminGiftCards";
import {
  AdminLogin,
  AdminDashboard,
  AdminProducts,
  ProductForm,
  AdminCategories,
  AdminTags,
  AdminStock,
  AdminSettings,
  AdminCoupons,
  AdminOrders,
  AdminColors,
  AdminCancellations,
  AdminCosts,
  AdminContacts,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes("removeChild")) {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/produto/:slug" element={<ProductPage />} />
                <Route path="/colecao/:slug" element={<CollectionPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/busca" element={<SearchPage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/gift-card" element={<GiftCardPage />} />
                <Route path="/gift-card/consultar" element={<CheckGiftCardPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/sucesso" element={<CheckoutSuccessPage />} />
                <Route path="/checkout/erro" element={<CheckoutErrorPage />} />
                <Route path="/checkout/pendente" element={<CheckoutPendingPage />} />
                <Route path="/novidades" element={<NewArrivalsPage />} />
                <Route path="/sale" element={<CollectionPage />} />
                <Route path="/sobre" element={<AboutPage />} />
                <Route path="/entrega" element={<DeliveryPolicyPage />} />
                <Route path="/trocas" element={<ReturnsPage />} />
                <Route path="/privacidade" element={<PrivacyPolicyPage />} />
                <Route path="/conta" element={<AccountPage />} />
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/produtos"
                  element={
                    <AdminLayout>
                      <AdminProducts />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/produtos/novo"
                  element={
                    <AdminLayout>
                      <ProductForm />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/produtos/:id"
                  element={
                    <AdminLayout>
                      <ProductForm />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/categorias"
                  element={
                    <AdminLayout>
                      <AdminCategories />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/tags"
                  element={
                    <AdminLayout>
                      <AdminTags />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/estoque"
                  element={
                    <AdminLayout>
                      <AdminStock />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/cores"
                  element={
                    <AdminLayout>
                      <AdminColors />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/gift-cards"
                  element={
                    <AdminLayout>
                      <AdminGiftCards />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/cupons"
                  element={
                    <AdminLayout>
                      <AdminCoupons />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pedidos"
                  element={
                    <AdminLayout>
                      <AdminOrders />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/cancelamentos"
                  element={
                    <AdminLayout>
                      <AdminCancellations />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/custos"
                  element={
                    <AdminLayout>
                      <AdminCosts />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/contatos"
                  element={
                    <AdminLayout>
                      <AdminContacts />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/configuracoes"
                  element={
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
