import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { SearchBar, MobileSearchPanel } from "./SearchBar";
import logoVitz from "@/assets/logo-vitz.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { getCartCount, setIsCartOpen } = useCart();
  
  const cartCount = getCartCount();

  const navLinks = [
    { name: "Produtos", href: "/produtos" },
    { name: "More Coffee", href: "/more-coffee-please" },
    { name: "Cartão Presente", href: "/gift-card" },
    { name: "Novidades", href: "/novidades" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="vitz-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Left Icons - Menu + Search */}
          <div className="md:hidden flex items-center gap-1">
            <button
              className="p-2 -ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <SearchBar 
              isExpanded={isSearchOpen} 
              onExpandChange={setIsSearchOpen}
              variant="mobile"
            />
          </div>

          {/* Logo + Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="flex items-center flex-shrink-0">
               <img 
                src={logoVitz} 
                alt="Vitz" 
                className="h-[7.5rem]"
                width={120}
                height={120}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="vitz-label text-muted-foreground hover:text-foreground transition-colors uppercase text-xs tracking-widest"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Centered Logo */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="flex items-center">
               <img 
                src={logoVitz} 
                alt="Vitz" 
                className="h-[7.5rem]"
                width={120}
                height={120}
              />
            </Link>
          </div>

          {/* Desktop Search Bar - Centered when open */}
          {isSearchOpen && (
            <div className="hidden md:flex items-center flex-1 justify-center max-w-md mx-4">
              <SearchBar 
                isExpanded={isSearchOpen} 
                onExpandChange={setIsSearchOpen}
                variant="desktop"
              />
            </div>
          )}

          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Desktop Search Toggle - only show when search is closed */}
            {!isSearchOpen && (
              <div className="hidden md:block">
                <SearchBar 
                  isExpanded={false} 
                  onExpandChange={setIsSearchOpen}
                  variant="desktop"
                />
              </div>
            )}
            
            <Link to="/conta">
              <Button variant="ghost" size="icon">
                <User size={20} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium animate-fade-in">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Panel - Below header */}
      <MobileSearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-background border-b border-border overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="vitz-container py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="block vitz-label text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
