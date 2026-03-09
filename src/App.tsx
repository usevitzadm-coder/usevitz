import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";

// Lazy-loaded routes for code splitting
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const NewArrivalsPage = lazy(() => import("./pages/NewArrivalsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const GiftCardPage = lazy(() => import("./pages/GiftCardPage"));
const CheckGiftCardPage = lazy(() => import("./pages/CheckGiftCardPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CheckoutSuccessPage = lazy(() => import("./pages/CheckoutSuccessPage"));
const CheckoutErrorPage = lazy(() => import("./pages/CheckoutErrorPage"));
const CheckoutPendingPage = lazy(() => import("./pages/CheckoutPendingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DeliveryPolicyPage = lazy(() => import("./pages/DeliveryPolicyPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const MoreCoffeePleasePage = lazy(() => import("./pages/MoreCoffeePleasePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminGiftCards = lazy(() => import("./pages/admin/AdminGiftCards"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminTags = lazy(() => import("./pages/admin/AdminTags"));
const AdminStock = lazy(() => import("./pages/admin/AdminStock"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminColors = lazy(() => import("./pages/admin/AdminColors"));
const AdminCancellations = lazy(() => import("./pages/admin/AdminCancellations"));
const AdminCosts = lazy(() => import("./pages/admin/AdminCosts"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));

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
              <Suspense fallback={null}>
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
                <Route path="/more-coffee-please" element={<MoreCoffeePleasePage />} />
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;