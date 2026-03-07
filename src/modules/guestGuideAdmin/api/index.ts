/**
 * API transport contracts for Guest Guide Admin.
 * Phase 0: placeholder only, no runtime implementation.
 */

export type GuestGuideAdminReadApi =
  | "get_home_config"
  | "get_page"
  | "get_index_pages"
  | "list_partners"
  | "track_event"
  | "get_kpi_summary";

export type GuestGuideMutationMode = "blocked" | "requires_architectural_decision";
