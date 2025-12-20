import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";
import { WebsiteSettingsInput } from "@/pages/WebsiteSettingsPage"; // Importando o tipo

interface GeneralSettingsFormProps {
  isSaving: boolean;
}

const GeneralSettingsForm = ({ isSaving }: GeneralSettingsFormProps) => {
  const { register, formState: { errors } } = useFormContext<WebsiteSettingsInput>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Informações Gerais do Site
        </CardTitle>
        <CardDescription>
          Defina o nome, descrição, logo, favicon e informações de contato do seu site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site_headline">Headline Principal (Título Grande)</Label>
          <Input
            id="site_headline"
            placeholder="Gestão de Propriedades Moderna e Completa"
            {...register("site_headline")}
            disabled={isSaving}
          />
          {errors.site_headline && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_headline.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Use a palavra-chave principal que será destacada com o gradiente. Ex: "Gestão de Propriedades Moderna e Completa"
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_name">Nome do Sistema/Site</Label>
          <Input
            id="site_name"
            placeholder="HostConnect"
            {...register("site_name")}
            disabled={isSaving}
          />
          {errors.site_name && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_description">Descrição Breve do Sistema</Label>
          <Textarea
            id="site_description"
            placeholder="Plataforma completa para gestão hoteleira e reservas online."
            rows={3}
            {...register("site_description")}
            disabled={isSaving}
          />
          {errors.site_description && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_description.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_logo_url">URL da Logo</Label>
          <Input
            id="site_logo_url"
            placeholder="https://seusite.com/logo.png"
            {...register("site_logo_url")}
            disabled={isSaving}
          />
          {errors.site_logo_url && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_logo_url.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Faça upload da sua logo no Supabase Storage e cole a URL pública aqui.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_favicon_url">URL do Favicon</Label>
          <Input
            id="site_favicon_url"
            placeholder="https://seusite.com/favicon.ico"
            {...register("site_favicon_url")}
            disabled={isSaving}
          />
          {errors.site_favicon_url && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_favicon_url.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Faça upload do seu favicon no Supabase Storage e cole a URL pública aqui.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_about_content">Conteúdo da Página "Sobre"</Label>
          <Textarea
            id="site_about_content"
            placeholder="Escreva aqui o conteúdo da sua página 'Sobre'..."
            rows={5}
            {...register("site_about_content")}
            disabled={isSaving}
          />
          {errors.site_about_content && (
            <p className="text-destructive text-sm mt-1">
              {errors.site_about_content.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Este conteúdo pode ser exibido em uma página "Sobre" dinâmica no seu site externo.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="blog_url">URL do Blog</Label>
          <Input
            id="blog_url"
            placeholder="https://medium.com/seu-blog"
            {...register("blog_url")}
            disabled={isSaving}
          />
          {errors.blog_url && (
            <p className="text-destructive text-sm mt-1">
              {errors.blog_url.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Link para o seu blog externo (ex: Medium, WordPress).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Email de Contato</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="contato@hostconnect.com.br"
            {...register("contact_email")}
            disabled={isSaving}
          />
          {errors.contact_email && (
            <p className="text-destructive text-sm mt-1">
              {errors.contact_email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Telefone de Contato</Label>
          <Input
            id="contact_phone"
            type="tel"
            placeholder="(49) 99999-9999"
            {...register("contact_phone")}
            disabled={isSaving}
          />
          {errors.contact_phone && (
            <p className="text-destructive text-sm mt-1">
              {errors.contact_phone.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo_url">URL da Demonstração</Label>
          <Input
            id="demo_url"
            placeholder="https://seusite.com/demo"
            {...register("demo_url")}
            disabled={isSaving}
          />
          {errors.demo_url && (
            <p className="text-destructive text-sm mt-1">
              {errors.demo_url.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Link para uma página de demonstração externa. Se vazio, o botão exibirá uma mensagem.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsForm;