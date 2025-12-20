import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
// import { useProperties } from "@/hooks/useProperties"; // Removido

const StatsSection = () => {
  // Fetch total properties
  const { data: totalProperties, isLoading: loadingProperties } = useQuery({
    queryKey: ['totalProperties'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count;
    },
  });

  // Fetch total confirmed bookings for the last month
  const { data: monthlyBookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['monthlyBookings'],
    queryFn: async () => {
      const lastMonthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount', { count: 'exact' })
        .in('status', ['confirmed', 'completed'])
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      if (error) throw error;
      
      const totalBookings = data.length;
      const totalRevenue = data.reduce((sum, booking) => sum + Number(booking.total_amount), 0);
      return { totalBookings, totalRevenue };
    },
  });

  const totalBookingsLastMonth = monthlyBookingsData?.totalBookings || 0;
  const totalRevenueLastMonth = monthlyBookingsData?.totalRevenue || 0;

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