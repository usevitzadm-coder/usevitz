import { ReactNode } from "react";
import BlackWeekCouponDialog from "@/components/blackweek/BlackWeekCouponDialog";
import { useBlackWeek } from "@/context/BlackWeekContext";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { phase } = useBlackWeek();
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]">
      <Header />
      <main className={`flex-1 overflow-x-hidden ${phase !== "off" ? "pt-32 md:pt-32" : "pt-16 md:pt-20"}`}>{children}</main>
      <Footer />
      <CartDrawer />
      <BlackWeekCouponDialog />
    </div>
  );
};

export default Layout;
