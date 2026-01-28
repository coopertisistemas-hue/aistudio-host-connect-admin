import { safeLogger } from '@/lib/logging/safeLogger';
import { isFeatureEnabled } from '@/lib/featureFlags';

type RouteLoader = () => Promise<unknown>;

export const loadBookingSuccessPage = () => import('@/pages/BookingSuccessPage');
export const loadFrontDeskPage = () => import('@/pages/FrontDeskPage');
export const loadAuditLogPage = () => import('@/pages/AuditLogPage');
export const loadDemandDetailPage = () => import('@/pages/DemandDetailPage');
export const loadRoomOperationDetailPage = () => import('@/pages/RoomOperationDetailPage');
export const loadFolioPage = () => import('@/pages/FolioPage');
export const loadLeadDetailPage = () => import('@/pages/LeadDetailPage');
export const loadSetupWizardPage = () => import('@/pages/SetupWizardPage');
export const loadAdminPricingPlansPage = () => import('@/pages/AdminPricingPlansPage');
export const loadAdminFeaturesPage = () => import('@/pages/AdminFeaturesPage');
export const loadAdminFaqsPage = () => import('@/pages/AdminFaqsPage');
export const loadAdminTestimonialsPage = () => import('@/pages/AdminTestimonialsPage');
export const loadAdminHowItWorksPage = () => import('@/pages/AdminHowItWorksPage');
export const loadAdminIntegrationsPage = () => import('@/pages/AdminIntegrationsPage');

const routeLoaders: Record<string, RouteLoader> = {
  '/booking-success': loadBookingSuccessPage,
  '/front-desk': loadFrontDeskPage,
  '/admin/audit-log': loadAuditLogPage,
  '/operation/demands': loadDemandDetailPage,
  '/operation/rooms': loadRoomOperationDetailPage,
  '/operation/folio': loadFolioPage,
  '/reservations/leads': loadLeadDetailPage,
  '/setup': loadSetupWizardPage,
  '/admin/pricing-plans': loadAdminPricingPlansPage,
  '/admin/features': loadAdminFeaturesPage,
  '/admin/faqs': loadAdminFaqsPage,
  '/admin/testimonials': loadAdminTestimonialsPage,
  '/admin/how-it-works': loadAdminHowItWorksPage,
  '/admin/integrations': loadAdminIntegrationsPage,
};

const prefetchedRoutes = new Set<string>();

const PREFETCH_ALLOWLIST = new Set([
  '/front-desk',
  '/operation/rooms',
  '/operation/demands',
  '/operation/folio',
]);

const normalizePath = (path: string) => path.split(/[?#]/)[0];

export const normalizeRouteKey = (path: string) => {
  const cleanPath = normalizePath(path);
  if (cleanPath.startsWith('/operation/rooms/')) return '/operation/rooms';
  if (cleanPath.startsWith('/operation/demands/')) return '/operation/demands';
  if (cleanPath.startsWith('/operation/folio/')) return '/operation/folio';
  if (cleanPath.startsWith('/reservations/leads/')) return '/reservations/leads';
  return cleanPath;
};

export const prefetchRoute = (path: string) => {
  // Safety: do not bypass feature flag gating or allowlist.
  if (!isFeatureEnabled('PREFETCH_NAV')) return;
  const key = normalizeRouteKey(path);
  const loader = routeLoaders[key];
  if (!loader || prefetchedRoutes.has(key) || !PREFETCH_ALLOWLIST.has(key)) return;
  prefetchedRoutes.add(key);
  loader().catch((error) => {
    safeLogger.debug('route.prefetch.failed', { message: (error as Error)?.message });
  });
};

export const lazyRouteLoaders = {
  loadBookingSuccessPage,
  loadFrontDeskPage,
  loadAuditLogPage,
  loadDemandDetailPage,
  loadRoomOperationDetailPage,
  loadFolioPage,
  loadLeadDetailPage,
  loadSetupWizardPage,
  loadAdminPricingPlansPage,
  loadAdminFeaturesPage,
  loadAdminFaqsPage,
  loadAdminTestimonialsPage,
  loadAdminHowItWorksPage,
  loadAdminIntegrationsPage,
};
