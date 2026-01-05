import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CollectionPage from "./pages/CollectionPage";
import CartPage from "./pages/CartPage";
import SearchPage from "./pages/SearchPage";
import ProductsPage from "./pages/ProductsPage";
import GiftCardPage from "./pages/GiftCardPage";
import CheckGiftCardPage from "./pages/CheckGiftCardPage";
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
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                <Route path="/novidades" element={<CollectionPage />} />
                <Route path="/sale" element={<CollectionPage />} />

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
                  path="/admin/gift-cards"
                  element={
                    <AdminLayout>
                      <AdminGiftCards />
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

export default App;
