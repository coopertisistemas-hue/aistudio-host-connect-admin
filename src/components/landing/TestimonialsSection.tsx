import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const TestimonialsSection = () => {
  const { testimonials, isLoading } = useTestimonials();

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Depoimentos</Badge>
            <h2 className="text-4xl font-bold mb-4">Carregando depoimentos...</h2>
          </div>
          <DataTableSkeleton rows={1} columns={3} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Depoimentos
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            O que nossos
            <span className="bg-gradient-hero bg-clip-text text-transparent"> clientes dizem</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="border-2 border-border hover:border-primary/20 hover:shadow-large transition-all duration-300 bg-gradient-card group">
              <CardHeader>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-accent fill-accent" />
                  ))}
                </div>
                <CardDescription className="text-base italic mb-6 leading-relaxed text-foreground/80">
                  "{testimonial.content}"
                </CardDescription>
                <div className="flex items-start gap-4 pt-4 border-t border-border">
                  <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary-foreground">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <CardTitle className="text-base mb-1">{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    {testimonial.location && <p className="text-xs text-muted-foreground mt-1">{testimonial.location}</p>}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;