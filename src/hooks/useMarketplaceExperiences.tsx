import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";

type ServiceExperienceRow = {
  id: string;
  name: string;
  price: number | null;
  status: string;
};

type BookingRow = {
  id: string;
  status: string;
};

type MarketplaceControl = {
  key: string;
  title: string;
  status: "pass" | "warning";
  detail: string;
};

export type MarketplaceFoundationData = {
  contractVersion: string;
  controls: MarketplaceControl[];
  metrics: {
    publishedExperiences: number;
    draftExperiences: number;
    monthlyBookings: number;
    estimatedAttachRevenue: number;
  };
  experiences: ServiceExperienceRow[];
};

export const useMarketplaceExperiences = () => {
  const { currentOrgId } = useOrg();
  const { selectedPropertyId } = useSelectedProperty();

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace-foundation", currentOrgId, selectedPropertyId],
    enabled: !!currentOrgId && !!selectedPropertyId,
    queryFn: async () => {
      if (!currentOrgId || !selectedPropertyId) {
        return {
          experiences: [] as ServiceExperienceRow[],
          bookings: [] as BookingRow[],
        };
      }

      const [servicesRes, bookingsRes] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, price, status")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId)
          .order("name", { ascending: true }),
        supabase
          .from("bookings")
          .select("id, status")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      return {
        experiences: (servicesRes.data ?? []) as ServiceExperienceRow[],
        bookings: (bookingsRes.data ?? []) as BookingRow[],
      };
    },
  });

  const summary = useMemo<MarketplaceFoundationData>(() => {
    const experiences = data?.experiences ?? [];
    const bookings = data?.bookings ?? [];

    const publishedExperiences = experiences.filter((experience) => experience.status === "active").length;
    const draftExperiences = experiences.length - publishedExperiences;
    const monthlyBookings = bookings.filter((booking) => booking.status !== "cancelled").length;

    const avgExperiencePrice =
      experiences.length > 0
        ? experiences.reduce((acc, experience) => acc + Number(experience.price ?? 0), 0) / experiences.length
        : 0;
    const estimatedAttachRevenue = monthlyBookings * 0.12 * avgExperiencePrice;

    const controls: MarketplaceControl[] = [
      {
        key: "tenant_scope",
        title: "Escopo Tenant",
        status: currentOrgId && selectedPropertyId ? "pass" : "warning",
        detail: currentOrgId && selectedPropertyId
          ? "org_id e property_id presentes no contexto operacional."
          : "Defina organização e propriedade antes de publicar experiências.",
      },
      {
        key: "catalog_readiness",
        title: "Prontidão de Catálogo",
        status: publishedExperiences > 0 ? "pass" : "warning",
        detail: publishedExperiences > 0
          ? `${publishedExperiences} experiências publicáveis no catálogo.`
          : "Nenhuma experiência ativa encontrada para publicação.",
      },
      {
        key: "reconciliation",
        title: "Reconciliação Operacional-Financeira",
        status: monthlyBookings > 0 ? "pass" : "warning",
        detail: monthlyBookings > 0
          ? "Base mínima de reservas disponível para reconciliação de comissionamento."
          : "Sem volume de reservas para baseline de reconciliação.",
      },
    ];

    return {
      contractVersion: "v1.0",
      controls,
      metrics: {
        publishedExperiences,
        draftExperiences,
        monthlyBookings,
        estimatedAttachRevenue: Number(estimatedAttachRevenue.toFixed(2)),
      },
      experiences,
    };
  }, [currentOrgId, data, selectedPropertyId]);

  return {
    summary,
    isLoading,
    error,
  };
};

