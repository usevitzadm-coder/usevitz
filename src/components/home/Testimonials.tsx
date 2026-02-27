import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Mariana S.",
    rating: 5,
    text: "As leggings são incríveis! Super confortáveis e não marcam nada. Virei cliente fiel.",
    product: "Legging Seamless Essential",
  },
  {
    id: 2,
    name: "Camila R.",
    rating: 5,
    text: "Qualidade excepcional. O tecido é macio e não fica transparente nos exercícios. Recomendo muito!",
    product: "Top Esportivo Breathe",
  },
  {
    id: 3,
    name: "Fernanda L.",
    rating: 5,
    text: "Melhor compra que fiz! As peças valorizam o corpo e são super duráveis. Já lavei várias vezes.",
    product: "Legging Power Sculpt",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="vitz-container">
        <div className="text-center mb-12">
          <span className="vitz-label text-primary">Depoimentos</span>
          <h2 className="vitz-heading-lg text-foreground mt-2">
            O que nossas clientes dizem
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-card p-8 rounded-sm border border-border"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="font-medium text-sm">{testimonial.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
