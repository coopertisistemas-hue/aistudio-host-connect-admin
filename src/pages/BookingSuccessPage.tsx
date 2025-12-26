import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle, Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookingEngine } from '@/hooks/useBookingEngine';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as analytics from "@/lib/analytics";
import { Booking } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');
  const { verifyStripeSession } = useBookingEngine();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId || !bookingId) {
        setVerificationStatus('failed');
        toast({
          title: "Erro de Verificação",
          description: "Parâmetros de sessão ou reserva ausentes.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await verifyStripeSession.mutateAsync({ session_id: sessionId, booking_id: bookingId });

        if (response.success && response.booking) {
          setVerificationStatus('success');
          setBookingDetails(response.booking);
          queryClient.invalidateQueries({ queryKey: ['bookings'] }); // Invalidate bookings cache
          toast({
            title: "Reserva Confirmada!",
            description: "Seu pagamento foi processado com sucesso e sua reserva está confirmada.",
            variant: "default", // Changed from "success" to "default"
          });

          // Track Purchase
          analytics.event({
            action: 'purchase',
            category: 'ecommerce',
            label: response.booking.id,
            value: response.booking.total_amount,
            currency: 'BRL'
          });
        } else {
          setVerificationStatus('failed');
          toast({
            title: "Falha na Verificação",
            description: response.message || "Não foi possível confirmar seu pagamento. Entre em contato com o suporte.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setVerificationStatus('failed');
        toast({
          title: "Erro na Verificação",
          description: error.message || "Ocorreu um erro ao verificar seu pagamento.",
          variant: "destructive",
        });
      }
    };

    verifySession();
  }, [sessionId, bookingId, verifyStripeSession, toast, queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {verificationStatus === 'loading' && (
            <Card className="p-8">
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
              <CardTitle className="text-2xl mb-2">Verificando seu pagamento...</CardTitle>
              <CardDescription>Por favor, aguarde enquanto confirmamos sua reserva.</CardDescription>
            </Card>
          )}

          {verificationStatus === 'success' && bookingDetails && (
            <Card className="p-8 border-success shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <CardTitle className="text-3xl mb-2 text-success">Reserva Confirmada!</CardTitle>
              <CardDescription className="text-lg mb-6">
                Seu pagamento foi processado com sucesso.
              </CardDescription>

              <div className="text-left space-y-3 border-t pt-4 mt-4">
                <p className="text-lg font-semibold">Detalhes da Reserva:</p>
                <p><strong>ID da Reserva:</strong> {bookingDetails.id}</p>
                <p><strong>Hóspede:</strong> {bookingDetails.guest_name}</p>
                <p><strong>Email:</strong> {bookingDetails.guest_email}</p>
                <p><strong>Check-in:</strong> {format(new Date(bookingDetails.check_in), 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p><strong>Check-out:</strong> {format(new Date(bookingDetails.check_out), 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p><strong>Valor Total:</strong> R$ {bookingDetails.total_amount.toFixed(2)}</p>
                {/* You might want to fetch property and room type names here if not already in bookingDetails */}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <Link to="/dashboard">
                  <Button variant="hero" size="lg">
                    Ir para o Dashboard
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" size="lg">
                    Voltar para a Página Inicial
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {verificationStatus === 'failed' && (
            <Card className="p-8 border-destructive shadow-lg">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-3xl mb-2 text-destructive">Falha na Reserva</CardTitle>
              <CardDescription className="text-lg mb-6">
                Não foi possível confirmar seu pagamento ou a reserva.
              </CardDescription>
              <p className="text-muted-foreground mb-6">
                Por favor, verifique os detalhes do seu pagamento ou entre em contato com o suporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <Link to="/book">
                  <Button variant="hero" size="lg">
                    Tentar Novamente
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" size="lg">
                    Voltar para a Página Inicial
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingSuccessPage;