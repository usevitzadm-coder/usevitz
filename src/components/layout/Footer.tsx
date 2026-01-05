import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import payment logos
import visaLogo from "@/assets/payment/visa.svg";
import eloLogo from "@/assets/payment/elo.png";
import pixLogo from "@/assets/payment/pix.png";
import mastercardLogo from "@/assets/payment/mastercard.png";
import boletoLogo from "@/assets/payment/boleto.png";
import logoVitz from "@/assets/logo-vitz.png";

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
      <div className="vitz-container py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo */}
          <div className="flex items-start justify-center md:justify-start">
            <Link to="/" className="inline-block">
              <img 
                src={logoVitz} 
                alt="Vitz" 
                className="h-[7.5rem] brightness-0 invert"
              />
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
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-1 h-10" title="Mastercard">
                <img src={mastercardLogo} alt="Mastercard" className="h-7 w-auto object-contain" />
              </div>
              {/* Visa */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-2 h-10" title="Visa">
                <img src={visaLogo} alt="Visa" className="h-4 w-auto object-contain" />
              </div>
              {/* Pix */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-1 h-10" title="Pix">
                <img src={pixLogo} alt="Pix" className="h-[3.25rem] w-auto object-contain" />
              </div>
              {/* Boleto */}
              <div className="bg-white rounded overflow-hidden flex items-center justify-center p-1 h-10" title="Boleto">
                <img src={boletoLogo} alt="Boleto" className="h-9 w-auto object-contain" />
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
