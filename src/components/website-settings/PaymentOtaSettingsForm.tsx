import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Globe, Building2, Plane } from "lucide-react";
import { WebsiteSettingsInput } from "@/pages/WebsiteSettingsPage"; // Importando o tipo

interface PaymentOtaSettingsFormProps {
  isSaving: boolean;
}

const PaymentOtaSettingsForm = ({ isSaving }: PaymentOtaSettingsFormProps) => {
  const { register, formState: { errors } } = useFormContext<WebsiteSettingsInput>();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Chaves de API do Stripe
          </CardTitle>
          <CardDescription>
            Insira suas chaves de API do Stripe para habilitar pagamentos para esta propriedade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe_publishable_key">Chave Publicável (Publishable Key)</Label>
            <Input
              id="stripe_publishable_key"
              placeholder="pk_live_..."
              {...register("stripe_publishable_key")}
              disabled={isSaving}
            />
            {errors.stripe_publishable_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.stripe_publishable_key.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Encontrada no Dashboard do Stripe &gt; Desenvolvedores &gt; Chaves de API.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_secret_key">Chave Secreta (Secret Key)</Label>
            <Input
              id="stripe_secret_key"
              type="password"
              placeholder="sk_live_..."
              {...register("stripe_secret_key")}
              disabled={isSaving}
            />
            {errors.stripe_secret_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.stripe_secret_key.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              **ATENÇÃO:** Esta chave é sensível. Mantenha-a segura.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe_webhook_secret">Chave Secreta do Webhook (Webhook Signing Secret)</Label>
            <Input
              id="stripe_webhook_secret"
              type="password"
              placeholder="whsec_..."
              {...register("stripe_webhook_secret")}
              disabled={isSaving}
            />
            {errors.stripe_webhook_secret && (
              <p className="text-destructive text-sm mt-1">
                {errors.stripe_webhook_secret.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Necessária para verificar a autenticidade dos eventos do Stripe.
              Crie um endpoint de webhook no Stripe e copie a chave de assinatura.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Integrações OTA (Booking.com, Airbnb, Expedia)
          </CardTitle>
          <CardDescription>
            Insira as chaves de API para integrar com as principais agências de viagem online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking_com_api_key">Booking.com API Key</Label>
            <Input
              id="booking_com_api_key"
              placeholder="Sua chave de API do Booking.com"
              {...register("booking_com_api_key")}
              disabled={isSaving}
            />
            {errors.booking_com_api_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.booking_com_api_key.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="airbnb_api_key">Airbnb API Key</Label>
            <Input
              id="airbnb_api_key"
              placeholder="Sua chave de API do Airbnb"
              {...register("airbnb_api_key")}
              disabled={isSaving}
            />
            {errors.airbnb_api_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.airbnb_api_key.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expedia_api_key">Expedia API Key</Label>
            <Input
              id="expedia_api_key"
              placeholder="Sua chave de API da Expedia"
              {...register("expedia_api_key")}
              disabled={isSaving}
            />
            {errors.expedia_api_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.expedia_api_key.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PaymentOtaSettingsForm;