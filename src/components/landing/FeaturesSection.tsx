import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { useFeatures, Feature } from "@/hooks/useFeatures";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const FeaturesSection = () => {
  const { features, isLoading } = useFeatures();

  if (isLoading) {
    return (
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Funcionalidades</Badge>
            <h2 className="text-4xl font-bold mb-4">Carregando funcionalidades...</h2>
          </div>
          <DataTableSkeleton rows={6} columns={3} />
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Funcionalidades
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Tudo que você precisa para
            <span className="bg-gradient-hero bg-clip-text text-transparent"> gerir seu negócio</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para automatizar e otimizar toda sua operação de hospedagem.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon ? (LucideIcons as any)[feature.icon] : LucideIcons.HelpCircle;
            return (
              <Card key={feature.id} className="group border-border hover:shadow-medium hover:border-primary/50 transition-all duration-300 bg-gradient-card cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;