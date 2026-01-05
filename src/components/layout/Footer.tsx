import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Payment Icons Components
const VisaIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#1A1F71"/>
    <path d="M19.5 21h-2.7l1.7-10.5h2.7L19.5 21zm-4.8 0h-2.8l-2.4-8.4-.3 1.6-1 4.8c-.1.7-.5 1-.9 1h-4.2l-.1-.3c.8-.2 1.7-.5 2.2-.8.3-.2.4-.4.5-.7l2.1-7.7h2.9l4 10.5zm20.3-6.8c0-.6.5-1.2 1.6-1.4.5-.1 1.9-.2 3.5.6l.6-2.9c-.8-.3-1.9-.6-3.3-.6-3.5 0-6 1.9-6 4.5 0 2 1.8 3.1 3.1 3.7 1.4.6 1.9 1.1 1.8 1.7 0 .9-1.1 1.3-2.1 1.3-1.8 0-2.8-.5-3.6-.8l-.6 3c.8.4 2.3.7 3.9.7 3.7 0 6.2-1.8 6.2-4.7 0-3.6-5.1-3.8-5.1-5.1zm14 6.8l-3.4-10.5h-2.4c-.5 0-1 .3-1.2.8l-4.2 9.7h2.9l.6-1.6h3.6l.3 1.6h2.6v0h.2zm-3.5-3.9l1.5-4.1.9 4.1h-2.4z" fill="white"/>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#F5F5F5"/>
    <circle cx="19" cy="16" r="8" fill="#EB001B"/>
    <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
    <path d="M24 10.3c1.8 1.4 3 3.5 3 5.7s-1.2 4.3-3 5.7c-1.8-1.4-3-3.5-3-5.7s1.2-4.3 3-5.7z" fill="#FF5F00"/>
  </svg>
);

const EloIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#000"/>
    <text x="24" y="19" textAnchor="middle" fill="#FFCB05" fontSize="12" fontWeight="bold" fontFamily="Arial">elo</text>
  </svg>
);

const HipercardIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#B3131B"/>
    <text x="24" y="19" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">HIPERCARD</text>
  </svg>
);

const AmexIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#006FCF"/>
    <text x="24" y="19" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">AMEX</text>
  </svg>
);

const PixIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
    <rect width="48" height="32" rx="4" fill="#F5F5F5"/>
    <path d="M29.7 11.3l-4.3 4.3c-.8.8-2 .8-2.8 0l-4.3-4.3c-.4-.4-1-.4-1.4 0l-2.8 2.8c-.4.4-.4 1 0 1.4l4.3 4.3c.8.8.8 2 0 2.8l-4.3 4.3c-.4.4-.4 1 0 1.4l2.8 2.8c.4.4 1 .4 1.4 0l4.3-4.3c.8-.8 2-.8 2.8 0l4.3 4.3c.4.4 1 .4 1.4 0l2.8-2.8c.4-.4.4-1 0-1.4l-4.3-4.3c-.8-.8-.8-2 0-2.8l4.3-4.3c.4-.4.4-1 0-1.4l-2.8-2.8c-.4-.4-1-.4-1.4 0z" fill="#32BCAD" transform="translate(0, -4) scale(0.7)"/>
    <text x="30" y="20" textAnchor="start" fill="#32BCAD" fontSize="10" fontWeight="bold" fontFamily="Arial">Pix</text>
  </svg>
);

const BoletoIcon = () => (
  <svg viewBox="0 0 48 32" className="h-6 w-auto">
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

  const paymentIcons = [
    { name: "Elo", icon: EloIcon },
    { name: "Mastercard", icon: MastercardIcon },
    { name: "Visa", icon: VisaIcon },
    { name: "Hipercard", icon: HipercardIcon },
    { name: "Amex", icon: AmexIcon },
    { name: "Pix", icon: PixIcon },
    { name: "Boleto", icon: BoletoIcon },
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
            <div className="grid grid-cols-4 gap-2">
              {paymentIcons.map(({ name, icon: Icon }) => (
                <div 
                  key={name}
                  className="bg-white rounded overflow-hidden flex items-center justify-center p-1"
                  title={name}
                >
                  <Icon />
                </div>
              ))}
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
