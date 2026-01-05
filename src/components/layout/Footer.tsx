import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const institutionalLinks = [
    { name: "Quem Somos", href: "/sobre" },
    { name: "Política de Entrega", href: "/entrega" },
    { name: "Trocas e Devoluções", href: "/trocas" },
    { name: "Política de Privacidade", href: "/privacidade" },
  ];

  const paymentMethods = [
    { name: "Elo", color: "#00A4E0" },
    { name: "Mastercard", color: "#EB001B" },
    { name: "Visa", color: "#1A1F71" },
    { name: "Hipercard", color: "#B3131B" },
    { name: "Amex", color: "#006FCF" },
    { name: "Pix", color: "#32BCAD" },
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
              {/* Payment method badges */}
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800">Elo</span>
              </div>
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">●●</span>
              </div>
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-800">VISA</span>
              </div>
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-red-700">Hiper</span>
              </div>
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">AMEX</span>
              </div>
              <div className="bg-white rounded px-2 py-1.5 flex items-center justify-center">
                <span className="text-xs font-bold text-teal-600">Pix</span>
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
