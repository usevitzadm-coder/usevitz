import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import payment logos
import visaLogo from "@/assets/payment/visa.svg";
import eloLogo from "@/assets/payment/elo.png";
import pixLogo from "@/assets/payment/pix.png";

// Mastercard SVG Icon
const MastercardIcon = () => (
  <svg viewBox="0 0 48 32" className="h-full w-auto">
    <rect width="48" height="32" rx="4" fill="#F5F5F5"/>
    <circle cx="18" cy="16" r="7" fill="#EB001B"/>
    <circle cx="30" cy="16" r="7" fill="#F79E1B"/>
    <path d="M24 10.8c1.5 1.2 2.5 3 2.5 5.2s-1 4-2.5 5.2c-1.5-1.2-2.5-3-2.5-5.2s1-4 2.5-5.2z" fill="#FF5F00"/>
  </svg>
);

// Boleto SVG Icon
const BoletoIcon = () => (
  <svg viewBox="0 0 48 32" className="h-full w-auto">
    <rect width="48" height="32" rx="4" fill="#F5F5F5"/>
    <rect x="6" y="8" width="2" height="16" fill="#333"/>
    <rect x="10" y="8" width="1" height="16" fill="#333"/>
    <rect x="13" y="8" width="3" height="16" fill="#333"/>
    <rect x="18" y="8" width="1" height="16" fill="#333"/>
    <rect x="21" y="8" width="2" height="16" fill="#333"/>
    <rect x="25" y="8" width="1" height="16" fill="#333"/>
    <rect x="28" y="8" width="3" height="16" fill="#333"/>
    <rect x="33" y="8" width="1" height="16" fill="#333"/>
    <rect x="36" y="8" width="2" height="16" fill="#333"/>
    <rect x="40" y="8" width="2" height="16" fill="#333"/>
  </svg>
);

const Footer = () => {
  const institutionalLinks = [
    { name: "Quem Somos", href: "/sobre" },
    { name: "Política de Entrega", href: "/entrega" },
    { name: "Trocas e Devoluções", href: "/trocas" },
    { name: "Política de Privacidade", href: "/privacidade" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/20">
        <div className="vitz-container py-10">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="font-heading text-xl md:text-2xl font-semibold mb-2">
              Faça parte do movimento
            </h3>
            <p className="text-sm text-primary-foreground/80 mb-6">
              Receba novidades, lançamentos exclusivos e 10% off na primeira compra
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 h-11 bg-white/10 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <Button 
                variant="secondary" 
                className="h-11 px-6 bg-background text-foreground hover:bg-background/90"
              >
                Inscrever
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="vitz-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {/* Logo */}
          <div className="flex items-start">
            <Link to="/" className="inline-block">
              <span className="font-heading text-3xl font-semibold lowercase tracking-wide">
                vitz
              </span>
            </Link>
          </div>

          {/* Entre em contato */}
          <div>
            <h4 className="font-medium italic mb-4">Entre em contato</h4>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Atendimento de segunda à<br />
              sexta-feira das 09h às 18h
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <Phone size={20} />
              </a>
              <a
                href="https://instagram.com/usevitz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="mailto:contato@usevitz.com"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="E-mail"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Links Institucionais */}
          <div>
            <ul className="space-y-3">
              {institutionalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-2 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <h4 className="font-medium mb-4">Formas de Pagamento</h4>
            <div className="grid grid-cols-3 gap-2">
              {/* Elo */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-2 h-10" title="Elo">
                <img src={eloLogo} alt="Elo" className="h-5 w-auto object-contain" />
              </div>
              {/* Mastercard */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center h-10" title="Mastercard">
                <MastercardIcon />
              </div>
              {/* Visa */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-2 h-10" title="Visa">
                <img src={visaLogo} alt="Visa" className="h-4 w-auto object-contain" />
              </div>
              {/* Pix */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-1 h-10" title="Pix">
                <img src={pixLogo} alt="Pix" className="h-6 w-auto object-contain" />
              </div>
              {/* Boleto */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center h-10" title="Boleto">
                <BoletoIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 mt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-xs text-primary-foreground/60">
            © 2025 Vitz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
