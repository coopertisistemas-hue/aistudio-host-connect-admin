import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Imported CardHeader, CardTitle, CardDescription
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, CreditCard, MapPin, CheckCircle2, XCircle, Receipt } from "lucide-react";
import { useInvoices, Invoice, InvoiceInput } from "@/hooks/useInvoices"; // Import InvoiceInput
import { Booking } from "@/hooks/useBookings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client"; // Import supabase

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  invoice: Invoice | null;
  onPaymentSuccess: (invoiceId: string, amount: number, method: string) => void;
  isProcessingPayment: boolean;
}

const InvoiceDialog = ({ open, onOpenChange, booking, invoice, onPaymentSuccess, isProcessingPayment }: InvoiceDialogProps) => {
  const { updateInvoice } = useInvoices(booking?.property_id);
  const [paymentMethod, setPaymentMethod] = useState<'local_cash' | 'local_card' | 'stripe' | 'pix'>('local_cash');
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Use o invoice real ou o booking para calcular o total
  const totalDue = useMemo(() => {
    if (!booking) return 0;
    return booking.total_amount;
  }, [booking]);

  const totalPaid = invoice?.paid_amount || 0;
  const remainingDue = totalDue - totalPaid;

  useEffect(() => {
    if (open && remainingDue > 0) {
      setPaymentAmount(Number(remainingDue.toFixed(2)));
    } else {
      setPaymentAmount(0);
    }
  }, [open, remainingDue]);

  if (!booking) return null;

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || paymentAmount > remainingDue) {
      alert("Valor de pagamento inválido.");
      return;
    }

    if (!invoice) {
      alert("Fatura não encontrada.");
      return;
    }

    const newPaidAmount = totalPaid + paymentAmount;
    let newStatus: InvoiceInput['status'] = 'partially_paid'; // Changed type to InvoiceInput['status']
    if (newPaidAmount >= totalDue) {
      newStatus = 'paid';
    } else if (newPaidAmount === 0) {
      newStatus = 'pending';
    }

    // Use a mutação do hook useInvoices para atualizar a fatura
    await updateInvoice.mutateAsync({
      id: invoice.id,
      invoice: {
        paid_amount: newPaidAmount,
        status: newStatus, // No need for explicit cast here if newStatus is already typed correctly
        payment_method: paymentMethod,
      }
    }, {
      onSuccess: () => {
        // Chame o callback de sucesso para que o FrontDeskPage possa finalizar o check-out
        onPaymentSuccess(invoice.id, paymentAmount, paymentMethod);
        onOpenChange(false);
      }
    });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-success hover:bg-success/80">Paga</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'partially_paid':
        return <Badge variant="destructive" className="bg-yellow-600 hover:bg-yellow-600/80">Parcialmente Paga</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Fatura da Reserva #{booking.id.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Faturamento para {booking.guest_name} ({booking.properties?.name})
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Detalhes da Fatura */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-semibold">Status:</p>
                  {invoice ? getStatusBadge(invoice.status as Invoice['status']) : <Badge variant="secondary">Gerando...</Badge>}
                </div>
                
                <div className="flex justify-between text-sm">
                  <p>Valor da Reserva:</p>
                  <p className="font-medium">R$ {totalDue.toFixed(2)}</p>
                </div>

                {booking.service_details && booking.service_details.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="font-semibold text-sm">Serviços Adicionais:</p>
                    {booking.service_details.map(service => (
                      <div key={service.id} className="flex justify-between text-xs text-muted-foreground">
                        <p>{service.name} ({service.is_per_day ? 'diária' : 'único'})</p>
                        <p>R$ {service.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-dashed">
                  <p>Total a Pagar:</p>
                  <p className="text-primary">R$ {totalDue.toFixed(2)}</p>
                </div>
                
                <div className="flex justify-between text-sm text-success font-medium">
                  <p>Total Pago:</p>
                  <p>R$ {totalPaid.toFixed(2)}</p>
                </div>

                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                  <p>Restante a Pagar:</p>
                  <p className={cn(remainingDue > 0 ? 'text-destructive' : 'text-success')}>
                    R$ {remainingDue.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna de Pagamento */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registrar Pagamento</CardTitle>
                <CardDescription>Registre pagamentos locais ou gere link de pagamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Valor do Pagamento (R$)</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingDue.toFixed(2)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    disabled={remainingDue <= 0 || isProcessingPayment}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: 'local_cash' | 'local_card' | 'stripe' | 'pix') => setPaymentMethod(value)}
                    disabled={remainingDue <= 0 || isProcessingPayment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_cash">Dinheiro (Local)</SelectItem>
                      <SelectItem value="local_card">Cartão (Local)</SelectItem>
                      <SelectItem value="stripe">Stripe (Online)</SelectItem>
                      <SelectItem value="pix">PIX (Online)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {remainingDue > 0 && (
                  <Button
                    onClick={handleRegisterPayment}
                    disabled={paymentAmount <= 0 || paymentAmount > remainingDue || isProcessingPayment}
                    className="w-full"
                  >
                    {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {paymentMethod.startsWith('local') ? 'Registrar Pagamento Local' : 'Gerar Link de Pagamento'}
                  </Button>
                )}

                {remainingDue <= 0 && (
                  <div className="text-center text-success font-semibold p-3 border border-success rounded-md">
                    <CheckCircle2 className="h-5 w-5 inline mr-2" />
                    Fatura Totalmente Paga!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;