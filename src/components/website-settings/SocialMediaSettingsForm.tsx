import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Instagram, Facebook, Globe as GoogleBusinessIcon, Smartphone, Wifi, Key } from "lucide-react"; // Import Key icon
import { WebsiteSettingsInput } from "@/pages/WebsiteSettingsPage"; // Importando o tipo
import { Checkbox } from "@/components/ui/checkbox";

interface SocialMediaSettingsFormProps {
  isSaving: boolean;
}

const SocialMediaSettingsForm = ({ isSaving }: SocialMediaSettingsFormProps) => {
  const { register, formState: { errors }, control } = useFormContext<WebsiteSettingsInput>();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Chaves de API de Marketing Digital
          </CardTitle>
          <CardDescription>
            Insira as chaves de API para permitir que o HostConnect gerencie avaliações e postagens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_business_api_key">Google Business Profile API Key</Label>
            <Input
              id="google_business_api_key"
              placeholder="Sua chave de API do Google Business Profile"
              {...register("google_business_api_key")}
              disabled={isSaving}
            />
            {errors.google_business_api_key && (
              <p className="text-destructive text-sm mt-1">
                {errors.google_business_api_key.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Necessário para responder avaliações e gerenciar informações do perfil.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_app_secret">Facebook App Secret (Meta Graph API)</Label>
            <Input
              id="facebook_app_secret"
              type="password"
              placeholder="Sua chave secreta do aplicativo Facebook/Meta"
              {...register("facebook_app_secret")}
              disabled={isSaving}
            />
            {errors.facebook_app_secret && (
              <p className="text-destructive text-sm mt-1">
                {errors.facebook_app_secret.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Necessário para gerenciar postagens e interações (Direct/Messenger) no Facebook e Instagram.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleBusinessIcon className="h-5 w-5 text-primary" />
            Links de Mídias Sociais
          </CardTitle>
          <CardDescription>
            Insira os links para suas páginas de mídias sociais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="social_instagram">URL do Instagram</Label>
            <Input
              id="social_instagram"
              placeholder="https://instagram.com/sua_propriedade"
              {...register("social_instagram")}
              disabled={isSaving}
            />
            {errors.social_instagram && (
              <p className="text-destructive text-sm mt-1">
                {errors.social_instagram.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_facebook">URL do Facebook</Label>
            <Input
              id="social_facebook"
              placeholder="https://facebook.com/sua_propriedade"
              {...register("social_facebook")}
              disabled={isSaving}
            />
            {errors.social_facebook && (
              <p className="text-destructive text-sm mt-1">
                {errors.social_facebook.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_google_business">URL do Google Perfil Empresas</Label>
            <Input
              id="social_google_business"
              placeholder="https://g.page/sua_propriedade"
              {...register("social_google_business")}
              disabled={isSaving}
            />
            {errors.social_google_business && (
              <p className="text-destructive text-sm mt-1">
                {errors.social_google_business.message}
              </p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t mt-6">
            <h4 className="font-semibold text-base">Outras Integrações na Landing Page</h4>
            <div className="flex items-center space-x-2">
              <Controller
                name="enable_whatsapp_integration"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="enable_whatsapp_integration"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                )}
              />
              <Label htmlFor="enable_whatsapp_integration" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                Exibir Integração WhatsApp
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="enable_api_integration"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="enable_api_integration"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                )}
              />
              <Label htmlFor="enable_api_integration" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                Exibir Integração API HostConnect
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SocialMediaSettingsForm;