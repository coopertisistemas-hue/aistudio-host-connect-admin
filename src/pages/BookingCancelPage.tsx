import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BookingCancelPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Card className="p-8 border-destructive shadow-lg">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-3xl mb-2 text-destructive">Reserva Cancelada</CardTitle>
            <CardDescription className="text-lg mb-6">
              Seu pagamento não foi concluído ou a reserva foi cancelada.
            </CardDescription>
            <p className="text-muted-foreground mb-6">
              Se você acredita que isso é um erro ou precisa de ajuda, por favor, entre em contato com o suporte.
              {bookingId && <span className="block mt-2">ID da Reserva: {bookingId}</span>}
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingCancelPage;