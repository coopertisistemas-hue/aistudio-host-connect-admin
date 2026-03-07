import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SelectedPropertyProvider } from "@/hooks/useSelectedProperty";
import { AccessContextProvider } from "@/platform/access";
import { TenantContextProvider } from "@/platform/tenant";
import RoleRoute from "@/components/guards/RoleRoute";
import TenantRoute from "@/components/guards/TenantRoute";
import ModuleRoute from "@/components/guards/ModuleRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugOverlay from "@/components/DebugOverlay";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import Financial from "./pages/Financial";
import Guests from "./pages/Guests";
import GuestDetailPage from "./pages/GuestDetailPage";
import Settings from "./pages/Settings";
import RoomTypesPage from "./pages/RoomTypes";
import RoomCategoriesPage from "./pages/RoomCategoriesPage";
import AmenitiesPage from "./pages/Amenities";
import InventoryPage from "./pages/InventoryPage";
import RoomsPage from "./pages/RoomsPage";
import AdminPanel from "./pages/AdminPanel";
import Plans from "./pages/Plans";
import PricingRulesPage from "./pages/PricingRulesPage";
import ServicesPage from "./pages/ServicesPage";
import BookingEnginePage from "./pages/BookingEnginePage";
import WebsiteSettingsPage from "./pages/WebsiteSettingsPage";
import PermissionsPage from "./pages/PermissionsPage";
import AuditLogPage from "./pages/AuditLogPage";
import StaffManagementAdminPage from "./pages/StaffManagementAdminPage";
import SupportHub from "./pages/support/SupportHub";
import TicketList from "./pages/support/TicketList";
import CreateTicket from "./pages/support/CreateTicket";
import TicketDetail from "./pages/support/TicketDetail";
import IdeaList from "./pages/support/IdeaList";
import CreateIdea from "./pages/support/CreateIdea";
import IdeaDetail from "./pages/support/IdeaDetail";

// Admin Support Imports
import AdminRoute from "./components/AdminRoute";
import AdminTicketList from "./pages/support/admin/AdminTicketList";
import AdminTicketDetail from "./pages/support/admin/AdminTicketDetail";
import AdminIdeaList from "./pages/support/admin/AdminIdeaList";
import AdminIdeaDetail from "./pages/support/admin/AdminIdeaDetail";
import TasksPage from "./pages/TasksPage";
import ExpensesPage from "./pages/ExpensesPage";
import NotFound from "./pages/NotFound";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingCancelPage from "./pages/BookingCancelPage";
import FrontDeskPage from "./pages/FrontDeskPage";
import AdminPricingPlansPage from "./pages/AdminPricingPlansPage";
import AdminFeaturesPage from "./pages/AdminFeaturesPage";
import AdminFaqsPage from "./pages/AdminFaqsPage";
import AdminTestimonialsPage from "./pages/AdminTestimonialsPage";
import AdminHowItWorksPage from "./pages/AdminHowItWorksPage";
import AdminIntegrationsPage from "./pages/AdminIntegrationsPage";
import ChannelManagerPage from "./pages/ChannelManagerPage";
import RoomsBoardPage from "./pages/RoomsBoardPage";
import RoomOperationDetailPage from "./pages/RoomOperationDetailPage";
import HousekeepingPage from "./pages/HousekeepingPage";
import DemandsPage from "./pages/DemandsPage";
import DemandDetailPage from "./pages/DemandDetailPage";
import FolioPage from "./pages/FolioPage";
import ArrivalsPage from "./pages/ArrivalsPage";
import DeparturesPage from "./pages/DeparturesPage";
import ShiftPlannerPage from "./pages/ShiftPlannerPage";
import MyShiftsPage from "./pages/MyShiftsPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import PipelinePage from "./pages/PipelinePage";
import LeadDetailPage from "./pages/LeadDetailPage";
import ReportPage from "./pages/ReportPage";
import MarketingOverview from "./pages/MarketingOverview";
import MarketingConnectors from "./pages/MarketingConnectors";
import GoogleMarketingDetails from "./pages/GoogleMarketingDetails";
import OTAMarketingDetails from "./pages/OTAMarketingDetails";
import SocialInbox from "./pages/SocialInbox";
import MobileHome from "./pages/mobile/MobileHome";
import MobileHousekeepingPage from "./pages/mobile/MobileHousekeepingPage";
import MobileProfile from "./pages/mobile/MobileProfile";
import HousekeepingList from "./pages/mobile/HousekeepingList";
import HousekeepingDetail from "./pages/mobile/HousekeepingDetail";
import MaintenanceList from "./pages/mobile/MaintenanceList";
import MaintenanceDetail from "./pages/mobile/MaintenanceDetail";
import OpsNowPage from "./pages/mobile/OpsNowPage";
import MobileRoomsMap from "./pages/mobile/MobileRoomsMap";
import MobileRoomDetail from "./pages/mobile/MobileRoomDetail";
import MobileNotifications from "./pages/mobile/MobileNotifications";
import LaundryList from "./pages/mobile/LaundryList";
import PantryList from "./pages/mobile/PantryList";
import PantryStockPage from "./pages/PantryStockPage"; // NEW
import PointOfSalePage from "./pages/PointOfSalePage"; // NEW
import MobileFinancial from "./pages/mobile/MobileFinancial";
import MobileReservations from "./pages/mobile/MobileReservations";
import MobileTaskDetail from "./pages/mobile/MobileTaskDetail";
import MobileExecutive from "./pages/mobile/MobileExecutive";
import { MobileRouteGuard } from "./components/mobile/MobileRouteGuard";
import { SessionLockManager } from "./components/SessionLockManager";
import PublicPreCheckinPage from "./pages/PublicPreCheckinPage";
import PublicGroupPreCheckinPage from "./pages/PublicGroupPreCheckinPage";
import SetupWizardPage from "./pages/SetupWizardPage";
import PostLoginRedirect from "./components/auth/PostLoginRedirect";
import ExecutiveConsolidationPage from "./pages/ExecutiveConsolidationPage";
import MarketplaceExperiencesPage from "./pages/MarketplaceExperiencesPage";
import BillingOrchestrationPage from "./pages/BillingOrchestrationPage";
import MonetizationConsolePage from "./pages/MonetizationConsolePage";
import SubscriptionLifecyclePage from "./pages/SubscriptionLifecyclePage";
import RevenueAssurancePage from "./pages/RevenueAssurancePage";

import { usePageTracking } from "./hooks/usePageTracking"; // GA4 Tracking

const PageTracker = () => {
  usePageTracking();
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PageTracker />
          <AuthProvider>
            <SelectedPropertyProvider>
              <AccessContextProvider>
                <TenantContextProvider>
                  <DebugOverlay />
                  {/* DebugOverlay removed */}
                  <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<RoleRoute><Onboarding /></RoleRoute>} />
                <Route path="/post-login" element={<RoleRoute><PostLoginRedirect /></RoleRoute>} />
                <Route path="/setup" element={<RoleRoute><SetupWizardPage /></RoleRoute>} />
                <Route path="/book/:propertyId?" element={<BookingEnginePage />} />
                <Route path="/booking-success" element={<BookingSuccessPage />} />
                <Route path="/booking-cancel" element={<BookingCancelPage />} />
                <Route path="/pre-checkin/:token" element={<PublicPreCheckinPage />} />
                <Route path="/pre-checkin-grupo/:token" element={<PublicGroupPreCheckinPage />} />
                <Route
                  path="/marketing/overview"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <MarketingOverview />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketing/connectors"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <MarketingConnectors />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketing/google"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <GoogleMarketingDetails />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketing/ota/:provider"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <OTAMarketingDetails />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketing/inbox"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <SocialInbox />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketing/inbox/:id"
                  element={
                    <ModuleRoute module="marketing" requireProperty>
                      <SocialInbox />
                    </ModuleRoute>
                  }
                />

                {/* Mobile Routes protected by Guard & Frame & Session Lock - NOW REMOVED LOCK per instructions */}
                <Route path="/m" element={<RoleRoute><MobileRouteGuard><MobileHome /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/profile" element={<RoleRoute><MobileRouteGuard><MobileProfile /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/housekeeping" element={<RoleRoute><MobileRouteGuard><MobileHousekeepingPage /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/housekeeping/task/:id" element={<RoleRoute><MobileRouteGuard><HousekeepingDetail /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/maintenance" element={<RoleRoute><MobileRouteGuard><MaintenanceList /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/maintenance/:id" element={<RoleRoute><MobileRouteGuard><MaintenanceDetail /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/ops-now" element={<RoleRoute><MobileRouteGuard><OpsNowPage /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/task/:id" element={<RoleRoute><MobileRouteGuard><MobileTaskDetail /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/rooms" element={<RoleRoute><MobileRouteGuard><MobileRoomsMap /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/rooms/:id" element={<RoleRoute><MobileRouteGuard><MobileRoomDetail /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/notifications" element={<RoleRoute><MobileRouteGuard><MobileNotifications /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/laundry" element={<RoleRoute><MobileRouteGuard><LaundryList /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/pantry" element={<RoleRoute><MobileRouteGuard><PantryList /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/financial" element={<RoleRoute><MobileRouteGuard><MobileFinancial /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/reservations" element={<RoleRoute><MobileRouteGuard><MobileReservations /></MobileRouteGuard></RoleRoute>} />
                <Route path="/m/executive" element={<RoleRoute><MobileRouteGuard><MobileExecutive /></MobileRouteGuard></RoleRoute>} />
                <Route
                  path="/dashboard"
                  element={
                    <TenantRoute>
                      <SessionLockManager>
                        <Dashboard />
                      </SessionLockManager>
                    </TenantRoute>
                  }
                />
                <Route
                  path="/front-desk"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <FrontDeskPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/arrivals"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <ArrivalsPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/departures"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <DeparturesPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/rooms"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <RoomsBoardPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/rooms/:id"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <RoomOperationDetailPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/housekeeping"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <HousekeepingPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/demands"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <DemandsPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/ops/pantry-stock"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <PantryStockPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/pdv"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <PointOfSalePage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/demands/:id"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <DemandDetailPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/operation/folio/:id"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <FolioPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/channel-manager"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <ChannelManagerPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/marketplace/experiences"
                  element={
                    <RoleRoute>
                      <MarketplaceExperiencesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/executive/consolidation"
                  element={
                    <ModuleRoute module="reports" requireProperty>
                      <ExecutiveConsolidationPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/ops/shifts"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <ShiftPlannerPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/me/shifts"
                  element={
                    <RoleRoute>
                      <MyShiftsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/ops/staff"
                  element={
                    <ModuleRoute module="operations" requireProperty>
                      <StaffManagementPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/reservations/pipeline"
                  element={
                    <RoleRoute>
                      <PipelinePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reservations/leads/:id"
                  element={
                    <RoleRoute>
                      <LeadDetailPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ModuleRoute module="reports" requireProperty>
                      <ReportPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/properties"
                  element={
                    <TenantRoute>
                      <SessionLockManager>
                        <Properties />
                      </SessionLockManager>
                    </TenantRoute>
                  }
                />
                <Route
                  path="/room-types"
                  element={
                    <RoleRoute>
                      <RoomTypesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/room-categories"
                  element={
                    <RoleRoute>
                      <RoomCategoriesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/amenities"
                  element={
                    <RoleRoute>
                      <AmenitiesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/rooms"
                  element={
                    <RoleRoute>
                      <RoomsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <RoleRoute>
                      <InventoryPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/pricing-rules"
                  element={
                    <RoleRoute>
                      <PricingRulesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <RoleRoute>
                      <ServicesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <RoleRoute>
                      <SessionLockManager>
                        <Bookings />
                      </SessionLockManager>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <RoleRoute>
                      <TasksPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <RoleRoute>
                      <ExpensesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/financial"
                  element={
                    <ModuleRoute module="financial" requireProperty>
                      <SessionLockManager>
                        <Financial />
                      </SessionLockManager>
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/billing/orchestration"
                  element={
                    <ModuleRoute module="billing" requireProperty>
                      <BillingOrchestrationPage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/billing/subscription-lifecycle"
                  element={
                    <ModuleRoute module="billing" requireProperty>
                      <SubscriptionLifecyclePage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/billing/revenue-assurance"
                  element={
                    <ModuleRoute module="billing" requireProperty>
                      <RevenueAssurancePage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/monetization/console"
                  element={
                    <ModuleRoute module="billing" requireProperty>
                      <MonetizationConsolePage />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/guests"
                  element={
                    <RoleRoute>
                      <SessionLockManager>
                        <Guests />
                      </SessionLockManager>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/guests/:id"
                  element={
                    <RoleRoute>
                      <SessionLockManager>
                        <GuestDetailPage />
                      </SessionLockManager>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RoleRoute>
                      <SessionLockManager>
                        <Settings />
                      </SessionLockManager>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/website-settings"
                  element={
                    <RoleRoute>
                      <WebsiteSettingsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/settings/permissions"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <PermissionsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/audit-log"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AuditLogPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/staff-management"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <StaffManagementAdminPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <RoleRoute>
                      <Plans />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin-panel"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <SessionLockManager>
                        <AdminPanel />
                      </SessionLockManager>
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/pricing-plans"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminPricingPlansPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/features"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminFeaturesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/faqs"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminFaqsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/testimonials"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminTestimonialsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/how-it-works"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminHowItWorksPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/integrations"
                  element={
                    <RoleRoute role="CLIENT_ADMIN" requireTenant>
                      <AdminIntegrationsPage />
                    </RoleRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                {/* Support Module Routes */}
                <Route
                  path="/support"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <SupportHub />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/tickets"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <TicketList />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/tickets/new"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <CreateTicket />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/tickets/:id"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <TicketDetail />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/ideas"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <IdeaList />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/ideas/new"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <CreateIdea />
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/ideas/:id"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <IdeaDetail />
                    </ModuleRoute>
                  }
                />

                {/* Admin Support Routes - Protected */}
                <Route
                  path="/support/admin/tickets"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <AdminRoute>
                        <AdminTicketList />
                      </AdminRoute>
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/admin/tickets/:id"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <AdminRoute>
                        <AdminTicketDetail />
                      </AdminRoute>
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/admin/ideas"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <AdminRoute>
                        <AdminIdeaList />
                      </AdminRoute>
                    </ModuleRoute>
                  }
                />
                <Route
                  path="/support/admin/ideas/:id"
                  element={
                    <ModuleRoute module="support" requireTenant>
                      <AdminRoute>
                        <AdminIdeaDetail />
                      </AdminRoute>
                    </ModuleRoute>
                  }
                />

                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </TenantContextProvider>
              </AccessContextProvider>
            </SelectedPropertyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

