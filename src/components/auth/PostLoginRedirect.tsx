import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * PostLoginRedirect - Phase 1 Finalization
 * Handles deterministic redirection after login based on role and onboarding status.
 * Ensures no flash of wrong content and prevents redirect loops.
 */
const PostLoginRedirect = () => {
    const { user, userRole, onboardingCompleted, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait until auth and profile data are fully loaded
        if (loading || onboardingCompleted === null) return;

        // If no user is present, something went wrong; back to auth
        if (!user) {
            navigate('/auth', { replace: true });
            return;
        }

        // --- Deterministic Redirection Logic ---

        // 1. If onboarding is incomplete => redirect to /setup
        // We use the tri-state onboardingCompleted from useAuth for speed
        if (!onboardingCompleted) {
            console.log('[PostLoginRedirect] Onboarding incomplete, routing to /setup');
            if (window.location.pathname !== '/setup') {
                navigate('/setup', { replace: true });
            }
            return;
        }

        // 2. If onboarding is complete, route per role
        console.log(`[PostLoginRedirect] Routing complete for role: ${userRole}`);

        let destination = '/front-desk'; // Default for most roles

        switch (userRole) {
            case 'staff_housekeeping':
                destination = '/m/housekeeping';
                break;
            case 'admin':
            case 'manager':
            case 'staff_frontdesk':
            case 'viewer':
            default:
                destination = '/front-desk';
                break;
        }

        // Prevent infinite loop if already at destination
        if (window.location.pathname !== destination) {
            navigate(destination, { replace: true });
        }
    }, [user, userRole, onboardingCompleted, loading, navigate]);

    // Minimal loading state to avoid flicker
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                    Carregando ambiente...
                </p>
            </div>
        </div>
    );
};

export default PostLoginRedirect;
