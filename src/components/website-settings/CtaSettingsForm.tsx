import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";
import { WebsiteSettingsInput } from "@/pages/WebsiteSettingsPage"; // Importando o tipo

interface CtaSettingsFormProps {
  isSaving: boolean;
}

const CtaSettingsForm = ({ isSaving }: CtaSettingsFormProps) => {
  const { register, formState: { errors } } = useFormContext<WebsiteSettingsInput>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          Seção de Chamada para Ação (CTA)
        </CardTitle>
        <CardDescription>
          Personalize o título e a descrição da seção de CTA na sua Landing Page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cta_title">Título da CTA</Label>
          <Input
            id="cta_title"
            placeholder="Pronto para transformar sua gestão hoteleira?"
            {...register("cta_title")}
            disabled={isSaving}
          />
          {errors.cta_title && (
            <p className="text-destructive text-sm mt-1">
              {errors.cta_title.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cta_description">Descrição da CTA</Label>
          <Textarea
            id="cta_description"
            placeholder="Junte-se a centenas de hotéis que já confiam no HostConnect."
            rows={3}
            {...register("cta_description")}
            disabled={isSaving}
          />
          {errors.cta_description && (
            <p className="text-destructive text-sm mt-1">
              {errors.cta_description.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CtaSettingsForm;