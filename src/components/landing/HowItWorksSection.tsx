import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, TrendingUp } from "lucide-react";
import { useHowItWorksSteps } from "@/hooks/useHowItWorksSteps";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { cn } from "@/lib/utils";

const HowItWorksSection = () => {
  const { steps, isLoading } = useHowItWorksSteps();

  if (isLoading) {
    return (
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Como Funciona</Badge>
            <h2 className="text-4xl font-bold mb-4">Carregando passos...</h2>
          </div>
          <DataTableSkeleton rows={1} columns={3} />
        </div>
      </section>
    );
  }

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <Badge variant="secondary" className="mb-4">
            Como Funciona
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Comece em
            <span className="bg-gradient-hero bg-clip-text text-transparent"> apenas {steps.length} passos</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Configure sua conta e comece a gerenciar suas reservas em minutos
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="relative group">
              <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-6 relative">
                    <div className={cn(
                      "h-20 w-20 rounded-full flex items-center justify-center mx-auto shadow-large group-hover:scale-110 transition-transform",
                      index === 0 && "bg-gradient-to-br from-primary to-primary/50",
                      index === 1 && "bg-gradient-to-br from-accent to-accent/50",
                      index === 2 && "bg-gradient-to-br from-success to-success/50",
                      index > 2 && "bg-gradient-to-br from-muted to-muted-foreground"
                    )}>
                      <span className={cn(
                        "text-3xl font-bold",
                        index === 0 && "text-primary-foreground",
                        index === 1 && "text-accent-foreground",
                        index === 2 && "text-success-foreground",
                        index > 2 && "text-foreground"
                      )}>
                        {step.step_number}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-3">{step.title}</CardTitle>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/4 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;