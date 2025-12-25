import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components
import { useProperties } from '@/hooks/useProperties';
import { useWebsiteSettings, WebsiteSettingInput } from '@/hooks/useWebsiteSettings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home, Settings, Globe, CreditCard, MessageSquare, Zap } from 'lucide-react'; // Import MessageSquare
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Importar os novos componentes
import GeneralSettingsForm from "@/components/website-settings/GeneralSettingsForm";
import CtaSettingsForm from "@/components/website-settings/CtaSettingsForm";
import PaymentOtaSettingsForm from "@/components/website-settings/PaymentOtaSettingsForm";
import SocialMediaSettingsForm from "@/components/website-settings/SocialMediaSettingsForm";
import GoogleReviewResponder from "@/components/website-settings/GoogleReviewResponder"; // NEW IMPORT
import { AiConfigWarning } from "@/components/AiConfigWarning";

// Helper para tratar strings vazias como null
const optionalStringOrNull = z.string().optional().nullable().transform(e => (e === "" ? null : e));
const optionalUrlOrNull = z.string().url("URL inválida.").optional().nullable().or(z.literal('')).transform(e => (e === "" ? null : e));

export const websiteSettingsSchema = z.object({
  property_id: z.string().min(1, "Selecione uma propriedade."),

  // General Website Settings
  site_headline: optionalStringOrNull,
  site_name: optionalStringOrNull,
  site_description: optionalStringOrNull,
  site_logo_url: optionalUrlOrNull,
  site_favicon_url: optionalUrlOrNull,
  site_about_content: optionalStringOrNull,
  blog_url: optionalUrlOrNull,
  contact_email: z.string().email("Email de contato inválido.").optional().nullable().or(z.literal('')).transform(e => (e === "" ? null : e)),
  contact_phone: optionalStringOrNull,
  demo_url: optionalUrlOrNull,

  // CTA Section Settings
  cta_title: optionalStringOrNull,
  cta_description: optionalStringOrNull,

  // Payment & OTA Settings
  stripe_publishable_key: optionalStringOrNull,
  stripe_secret_key: optionalStringOrNull,
  stripe_webhook_secret: optionalStringOrNull,
  booking_com_api_key: optionalStringOrNull,
  airbnb_api_key: optionalStringOrNull,
  expedia_api_key: optionalStringOrNull,

  // Social Media & Marketing API Keys
  google_business_api_key: optionalStringOrNull,
  facebook_app_secret: optionalStringOrNull,

  // Social Media Links & Integration Visibility Settings
  social_instagram: optionalUrlOrNull,
  social_facebook: optionalUrlOrNull,
  social_google_business: optionalUrlOrNull,
  enable_whatsapp_integration: z.boolean().optional().nullable().default(false),
  enable_api_integration: z.boolean().optional().nullable().default(false),
});

export type WebsiteSettingsInput = z.infer<typeof websiteSettingsSchema>;

const WebsiteSettingsPage = () => {
  const { toast } = useToast();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(undefined);

  const {
    settings: propertySettings,
    isLoading: settingsLoading,
    createSetting,
    updateSetting,
  } = useWebsiteSettings(selectedPropertyId);

  const formMethods = useForm<WebsiteSettingsInput>({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      property_id: "",
      site_headline: "",
      site_name: "",
      site_description: "",
      site_logo_url: "",
      site_favicon_url: "",
      site_about_content: "",
      blog_url: "",
      contact_email: "",
      contact_phone: "",
      demo_url: "",
      cta_title: "",
      cta_description: "",
      stripe_publishable_key: "",
      stripe_secret_key: "",
      stripe_webhook_secret: "",
      booking_com_api_key: "",
      airbnb_api_key: "",
      expedia_api_key: "",
      google_business_api_key: "",
      facebook_app_secret: "",
      social_instagram: "",
      social_facebook: "",
      social_google_business: "",
      enable_whatsapp_integration: false,
      enable_api_integration: false,
    },
  });

  const { control, reset, handleSubmit, formState: { errors } } = formMethods;

  useEffect(() => {
    if (!propertiesLoading && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
      formMethods.setValue("property_id", properties[0].id);
    }
  }, [propertiesLoading, properties, selectedPropertyId, formMethods]);

  useEffect(() => {
    if (selectedPropertyId && propertySettings) {
      const getSettingValue = (key: keyof WebsiteSettingsInput) => {
        const setting = propertySettings.find(s => s.setting_key === key);
        // Handle boolean values stored as true/false or string 'true'/'false'
        if (typeof setting?.setting_value === 'boolean') {
          return setting.setting_value;
        }
        // Handle null/undefined/empty string
        return setting?.setting_value || "";
      };

      reset({
        property_id: selectedPropertyId,
        site_headline: getSettingValue('site_headline'),
        site_name: getSettingValue('site_name'),
        site_description: getSettingValue('site_description'),
        site_logo_url: getSettingValue('site_logo_url'),
        site_favicon_url: getSettingValue('site_favicon_url'),
        site_about_content: getSettingValue('site_about_content'),
        blog_url: getSettingValue('blog_url'),
        contact_email: getSettingValue('contact_email'),
        contact_phone: getSettingValue('contact_phone'),
        demo_url: getSettingValue('demo_url'),
        cta_title: getSettingValue('cta_title'),
        cta_description: getSettingValue('cta_description'),
        stripe_publishable_key: getSettingValue('stripe_publishable_key'),
        stripe_secret_key: getSettingValue('stripe_secret_key'),
        stripe_webhook_secret: getSettingValue('stripe_webhook_secret'),
        booking_com_api_key: getSettingValue('booking_com_api_key'),
        airbnb_api_key: getSettingValue('airbnb_api_key'),
        expedia_api_key: getSettingValue('expedia_api_key'),
        google_business_api_key: getSettingValue('google_business_api_key'),
        facebook_app_secret: getSettingValue('facebook_app_secret'),
        social_instagram: getSettingValue('social_instagram'),
        social_facebook: getSettingValue('social_facebook'),
        social_google_business: getSettingValue('social_google_business'),
        enable_whatsapp_integration: getSettingValue('enable_whatsapp_integration') === true,
        enable_api_integration: getSettingValue('enable_api_integration') === true,
      });
    } else if (!selectedPropertyId) {
      reset({
        property_id: "",
        site_headline: "",
        site_name: "",
        site_description: "",
        site_logo_url: "",
        site_favicon_url: "",
        site_about_content: "",
        blog_url: "",
        contact_email: "",
        contact_phone: "",
        demo_url: "",
        cta_title: "",
        cta_description: "",
        stripe_publishable_key: "",
        stripe_secret_key: "",
        stripe_webhook_secret: "",
        booking_com_api_key: "",
        airbnb_api_key: "",
        expedia_api_key: "",
        google_business_api_key: "",
        facebook_app_secret: "",
        social_instagram: "",
        social_facebook: "",
        social_google_business: "",
        enable_whatsapp_integration: false,
        enable_api_integration: false,
      });
    }
  }, [selectedPropertyId, propertySettings, reset]);

  const handleSaveSettings = async (data: WebsiteSettingsInput) => {
    if (!selectedPropertyId) {
      toast({
        title: "Erro",
        description: "Selecione uma propriedade para salvar as configurações.",
        variant: "destructive",
      });
      return;
    }

    // Filter out property_id from the settings keys
    const settingsKeys = Object.keys(websiteSettingsSchema.shape).filter(key => key !== 'property_id') as (keyof WebsiteSettingsInput)[];

    for (const key of settingsKeys) {
      const value = data[key];
      const existingSetting = propertySettings.find(s => s.setting_key === key);

      // Determine the value to save (null if empty string or null, otherwise the value)
      const valueToSave = (typeof value === 'string' && value.trim() === '') ? null : value;

      const settingData: WebsiteSettingInput = {
        property_id: selectedPropertyId,
        setting_key: key,
        setting_value: valueToSave,
      };

      if (existingSetting) {
        await updateSetting.mutateAsync({ id: existingSetting.id, setting: settingData });
      } else if (valueToSave !== null && valueToSave !== undefined) {
        await createSetting.mutateAsync(settingData);
      }
    }

    toast({
      title: "Sucesso!",
      description: "Configurações do site e integrações atualizadas.",
    });
  };

  const isSaving = createSetting.isPending || updateSetting.isPending;

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações do Site e Integrações</h1>
          <p className="text-muted-foreground">Gerencie as informações do seu site, pagamentos e integrações para suas propriedades.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione a Propriedade</CardTitle>
            <CardDescription>Escolha a propriedade para configurar as chaves de API e informações do site.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name="property_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedPropertyId(value);
                  }}
                  disabled={propertiesLoading || properties.length === 0 || isSaving}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name} ({prop.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.property_id && (
              <p className="text-destructive text-sm mt-1">
                {errors.property_id.message}
              </p>
            )}
          </CardContent>
        </Card>

        {selectedPropertyId ? (
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">
                    <Settings className="h-4 w-4 mr-2" />
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="cta">
                    <Globe className="h-4 w-4 mr-2" />
                    Landing Page
                  </TabsTrigger>
                  <TabsTrigger value="payment">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagamento & OTA
                  </TabsTrigger>
                  <TabsTrigger value="social">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Marketing & Social
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    <Zap className="h-4 w-4 mr-2" />
                    Concierge IA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-4">
                  <GeneralSettingsForm isSaving={isSaving} />
                </TabsContent>

                <TabsContent value="cta" className="space-y-6 mt-4">
                  <CtaSettingsForm isSaving={isSaving} />
                </TabsContent>

                <TabsContent value="payment" className="space-y-6 mt-4">
                  <PaymentOtaSettingsForm isSaving={isSaving} />
                </TabsContent>

                <TabsContent value="social" className="space-y-6 mt-4">
                  <SocialMediaSettingsForm isSaving={isSaving} />
                  <GoogleReviewResponder propertyId={selectedPropertyId} />
                </TabsContent>

                <TabsContent value="ai" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuração do Concierge IA</CardTitle>
                      <CardDescription>Gerencie o assistente virtual do seu site.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AiConfigWarning featureName="Concierge IA (OpenAI/Gemini)" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Todas as Configurações
              </Button>
            </form>
          </FormProvider>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para configurar suas chaves de pagamento e integrações.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WebsiteSettingsPage;