import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SelectedPropertyProvider } from "@/hooks/useSelectedProperty"; // NEW IMPORT
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugOverlay from "@/components/DebugOverlay";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import Financial from "./pages/Financial";
import Guests from "./pages/Guests";
import Settings from "./pages/Settings";
import RoomTypesPage from "./pages/RoomTypes";
import AmenitiesPage from "./pages/Amenities";
import RoomsPage from "./pages/RoomsPage";
import AdminPanel from "./pages/AdminPanel";
import PricingRulesPage from "./pages/PricingRulesPage";
import ServicesPage from "./pages/ServicesPage";
import BookingEnginePage from "./pages/BookingEnginePage";
import WebsiteSettingsPage from "./pages/WebsiteSettingsPage";
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
import MarketingOverview from "./pages/MarketingOverview";
import MarketingConnectors from "./pages/MarketingConnectors";
import GoogleMarketingDetails from "./pages/GoogleMarketingDetails";
import OTAMarketingDetails from "./pages/OTAMarketingDetails";
import SocialInbox from "./pages/SocialInbox";
import MobileHome from "./pages/mobile/MobileHome";
import MobileProfile from "./pages/mobile/MobileProfile";
import HousekeepingList from "./pages/mobile/HousekeepingList";
import HousekeepingDetail from "./pages/mobile/HousekeepingDetail";
import MobileNotifications from "./pages/mobile/MobileNotifications";
import LaundryList from "./pages/mobile/LaundryList";
import PantryList from "./pages/mobile/PantryList";
import MobileFinancial from "./pages/mobile/MobileFinancial";
import { MobileRouteGuard } from "./components/mobile/MobileRouteGuard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SelectedPropertyProvider> {/* WRAP WITH PROPERTY PROVIDER */}
              <DebugOverlay />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/book/:propertyId?" element={<BookingEnginePage />} />
                <Route path="/booking-success" element={<BookingSuccessPage />} />
                <Route path="/booking-cancel" element={<BookingCancelPage />} />
                <Route path="/marketing/overview" element={<ProtectedRoute><MarketingOverview /></ProtectedRoute>} />
                <Route path="/marketing/connectors" element={<ProtectedRoute><MarketingConnectors /></ProtectedRoute>} />
                <Route path="/marketing/google" element={<ProtectedRoute><GoogleMarketingDetails /></ProtectedRoute>} />
                <Route path="/marketing/ota/:provider" element={<ProtectedRoute><OTAMarketingDetails /></ProtectedRoute>} />
                <Route path="/marketing/inbox" element={<ProtectedRoute><SocialInbox /></ProtectedRoute>} />
                <Route path="/marketing/inbox/:id" element={<ProtectedRoute><SocialInbox /></ProtectedRoute>} />

                {/* Mobile Routes protected by Guard & Frame */}
                <Route path="/m" element={<ProtectedRoute><MobileRouteGuard><MobileHome /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/profile" element={<ProtectedRoute><MobileRouteGuard><MobileProfile /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/housekeeping" element={<ProtectedRoute><MobileRouteGuard><HousekeepingList /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/housekeeping/task/:id" element={<ProtectedRoute><MobileRouteGuard><HousekeepingDetail /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/notifications" element={<ProtectedRoute><MobileRouteGuard><MobileNotifications /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/laundry" element={<ProtectedRoute><MobileRouteGuard><LaundryList /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/pantry" element={<ProtectedRoute><MobileRouteGuard><PantryList /></MobileRouteGuard></ProtectedRoute>} />
                <Route path="/m/financial" element={<ProtectedRoute><MobileRouteGuard><MobileFinancial /></MobileRouteGuard></ProtectedRoute>} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/front-desk"
                  element={
                    <ProtectedRoute>
                      <FrontDeskPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/arrivals"
                  element={
                    <ProtectedRoute>
                      <ArrivalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/departures"
                  element={
                    <ProtectedRoute>
                      <DeparturesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/rooms"
                  element={
                    <ProtectedRoute>
                      <RoomsBoardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/rooms/:id"
                  element={
                    <ProtectedRoute>
                      <RoomOperationDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/housekeeping"
                  element={
                    <ProtectedRoute>
                      <HousekeepingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/demands"
                  element={
                    <ProtectedRoute>
                      <DemandsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/demands/:id"
                  element={
                    <ProtectedRoute>
                      <DemandDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operation/folio/:id"
                  element={
                    <ProtectedRoute>
                      <FolioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/channel-manager"
                  element={
                    <ProtectedRoute>
                      <ChannelManagerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ops/shifts"
                  element={
                    <ProtectedRoute>
                      <ShiftPlannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/me/shifts"
                  element={
                    <ProtectedRoute>
                      <MyShiftsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ops/staff"
                  element={
                    <ProtectedRoute>
                      <StaffManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservations/pipeline"
                  element={
                    <ProtectedRoute>
                      <PipelinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservations/leads/:id"
                  element={
                    <ProtectedRoute>
                      <LeadDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/properties"
                  element={
                    <ProtectedRoute>
                      <Properties />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/room-types"
                  element={
                    <ProtectedRoute>
                      <RoomTypesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/amenities"
                  element={
                    <ProtectedRoute>
                      <AmenitiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rooms"
                  element={
                    <ProtectedRoute>
                      <RoomsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pricing-rules"
                  element={
                    <ProtectedRoute>
                      <PricingRulesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute>
                      <ServicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute>
                      <ExpensesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financial"
                  element={
                    <ProtectedRoute>
                      <Financial />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guests"
                  element={
                    <ProtectedRoute>
                      <Guests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/website-settings"
                  element={
                    <ProtectedRoute>
                      <WebsiteSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-panel"
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pricing-plans"
                  element={
                    <ProtectedRoute>
                      <AdminPricingPlansPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/features"
                  element={
                    <ProtectedRoute>
                      <AdminFeaturesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/faqs"
                  element={
                    <ProtectedRoute>
                      <AdminFaqsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/testimonials"
                  element={
                    <ProtectedRoute>
                      <AdminTestimonialsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/how-it-works"
                  element={
                    <ProtectedRoute>
                      <AdminHowItWorksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/integrations"
                  element={
                    <ProtectedRoute>
                      <AdminIntegrationsPage />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SelectedPropertyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;