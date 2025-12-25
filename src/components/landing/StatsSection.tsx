import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


const StatsSection = () => {
  // Static stats for public landing page
  const totalProperties = 150;
  const totalBookingsLastMonth = 1250;
  const totalRevenueLastMonth = 450000;
  const loadingProperties = false;
  const loadingBookings = false;

  return (
    <section className="py-16 border-y border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {loadingProperties ? '...' : `${totalProperties}+`}
            </div>
            <div className="text-sm text-muted-foreground">Propriedades Ativas</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {loadingBookings ? '...' : `${totalBookingsLastMonth}+`}
            </div>
            <div className="text-sm text-muted-foreground">Reservas Confirmadas/Mês</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {loadingBookings ? '...' : `R$ ${totalRevenueLastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </div>
            <div className="text-sm text-muted-foreground">Receita Gerada/Mês</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              98%
            </div>
            <div className="text-sm text-muted-foreground">Satisfação</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;