import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RespondToReviewInput {
  property_id: string;
  review_id: string;
  response_text: string;
}

interface SocialMediaResponse {
  success: boolean;
  message: string;
}

export const useSocialMediaManager = () => {

  const respondToGoogleReview = useMutation<SocialMediaResponse, Error, RespondToReviewInput>({
    mutationFn: async (data) => {
      const { data: response, error } = await supabase.functions.invoke('social-media-manager', {
        body: JSON.stringify({
          action: 'respond_to_google_review',
          property_id: data.property_id,
          payload: {
            review_id: data.review_id,
            response_text: data.response_text,
          }
        }),
      });

      if (error) throw error;
      return response as SocialMediaResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na Resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    respondToGoogleReview,
  };
};