import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    shop: [
      { name: "Feminino", href: "/colecao/feminino" },
      { name: "Masculino", href: "/colecao/masculino" },
      { name: "Novidades", href: "/novidades" },
      { name: "Sale", href: "/sale" },
    ],
    help: [
      { name: "Atendimento", href: "/atendimento" },
      { name: "Trocas e Devoluções", href: "/trocas" },
      { name: "Rastrear Pedido", href: "/rastrear" },
      { name: "Guia de Tamanhos", href: "/tamanhos" },
    ],
    about: [
      { name: "Nossa História", href: "/sobre" },
      { name: "Sustentabilidade", href: "/sustentabilidade" },
      { name: "Trabalhe Conosco", href: "/carreiras" },
    ],
  };

  return (
    <footer className="bg-vitz-cream-dark border-t border-border">
      <div className="vitz-container py-16">
        {/* Newsletter */}
        <div className="text-center mb-16">
          <h3 className="vitz-heading-md text-foreground mb-3">
            Faça parte do movimento
          </h3>
          <p className="vitz-body text-muted-foreground mb-6 max-w-md mx-auto">
            Receba novidades, lançamentos exclusivos e 10% off na primeira compra
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Seu e-mail"
              className="flex-1 h-12 bg-background border-border"
            />
            <Button variant="hero" size="lg">
              Inscrever
            </Button>
          </form>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-heading text-2xl font-semibold text-foreground">
                VITZ
              </span>
            </Link>
            <p className="vitz-body text-muted-foreground text-sm mb-4">
              Roupas fitness premium para quem vive em movimento.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="vitz-label text-foreground mb-4">Comprar</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="vitz-label text-foreground mb-4">Ajuda</h4>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="vitz-label text-foreground mb-4">Sobre</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 Vitz. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link to="/privacidade" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/termos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
