import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]">
      <Header />
      <main className="flex-1 pt-16 md:pt-20 overflow-x-hidden">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default Layout;
