import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Star, AlertTriangle } from "lucide-react"; // Import AlertTriangle
import { useSocialMediaManager } from '@/hooks/useSocialMediaManager';
import { useToast } from '@/hooks/use-toast';

interface GoogleReviewResponderProps {
  propertyId: string;
}

// Dados simulados de um review que precisaria de resposta
const MOCK_REVIEW = {
  id: "mock-review-12345",
  reviewer: "Maria Oliveira",
  rating: 4,
  comment: "Ótima estadia, mas o Wi-Fi estava lento no quarto 302.",
  date: "2024-08-15",
};

const GoogleReviewResponder = ({ propertyId }: GoogleReviewResponderProps) => {
  const { respondToGoogleReview } = useSocialMediaManager();
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();

  const isApiKeyConfigured = import.meta.env.VITE_GOOGLE_BUSINESS_API_KEY; // Use import.meta.env for browser environment

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast({
        title: "Erro",
        description: "A resposta não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    await respondToGoogleReview.mutateAsync({
      property_id: propertyId,
      review_id: MOCK_REVIEW.id,
      response_text: responseText,
    });
    setResponseText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Responder a Avaliações (Google Business)
        </CardTitle>
        <CardDescription>
          Demonstração de como o HostConnect pode responder a reviews automaticamente ou manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isApiKeyConfigured && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Atenção: A chave GOOGLE_BUSINESS_API_KEY não está configurada no Secret Manager do Supabase. A funcionalidade será simulada.
          </div>
        )}
        
        <div className="border p-4 rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{MOCK_REVIEW.reviewer}</p>
            <div className="flex items-center gap-1">
              {[...Array(MOCK_REVIEW.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-accent fill-accent" />
              ))}
            </div>
          </div>
          <p className="text-sm italic text-muted-foreground">"{MOCK_REVIEW.comment}"</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="response_text">Sua Resposta</Label>
          <Textarea
            id="response_text"
            placeholder="Agradeça o feedback e aborde o ponto levantado..."
            rows={4}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            disabled={respondToGoogleReview.isPending}
          />
        </div>

        <Button 
          onClick={handleRespond} 
          disabled={respondToGoogleReview.isPending || !propertyId || !responseText.trim()}
        >
          {respondToGoogleReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar Resposta (Simulado)
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleReviewResponder;