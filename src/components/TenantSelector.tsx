import { Building2, Home, Check, ChevronDown } from 'lucide-react';
import { useOrg } from '@/hooks/useOrg';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TenantSelectorMode = 'org_property' | 'property_only' | 'hidden';

interface TenantSelectorProps {
    mode?: TenantSelectorMode;
    className?: string;
}

export const TenantSelector = ({ mode = 'property_only', className }: TenantSelectorProps) => {
    const { userRole } = useAuth();
    const { isSuperAdmin, allOrganizations, currentOrgId, setSelectedOrgId, organization: currentOrg } = useOrg();
    const { selectedPropertyId, setSelectedPropertyId, properties } = useSelectedProperty();
    const { onboarding } = useOnboardingState();

    // Determine mode based on role if not explicitly provided
    const effectiveMode = mode === 'property_only' && isSuperAdmin ? 'org_property' : mode;

    // STAFF: Hidden - no selector for staff roles
    if (userRole === 'staff_housekeeping' || userRole === 'staff_frontdesk' || userRole === 'viewer') {
        return null;
    }

    // Get current property
    const currentProperty = properties.find(p => p.id === selectedPropertyId);
    
    // Fallback: use onboarding property_id if no property selected
    const fallbackPropertyId = onboarding?.property_id;
    
    // Auto-select onboarding property if available and no property selected
    const displayPropertyId = selectedPropertyId || fallbackPropertyId;
    const displayProperty = properties.find(p => p.id === displayPropertyId) || currentProperty;

    // === SUPER ADMIN: Full Org + Property selector ===
    if (effectiveMode === 'org_property' && isSuperAdmin) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {/* Organization Selector */}
                <Select
                    value={currentOrgId || ''}
                    onValueChange={(value) => {
                        setSelectedOrgId(value);
                        // Reset property when org changes
                        setSelectedPropertyId(null);
                    }}
                >
                    <SelectTrigger className="w-[200px] h-9 bg-background border-primary/20">
                        <Building2 className="h-4 w-4 mr-2 text-primary" />
                        <SelectValue placeholder="Selecionar organização" />
                    </SelectTrigger>
                    <SelectContent>
                        {allOrganizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                    <span>{org.name}</span>
                                    {org.id === currentOrgId && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Property Selector */}
                <Select
                    value={selectedPropertyId || ''}
                    onValueChange={setSelectedPropertyId}
                    disabled={!currentOrgId}
                >
                    <SelectTrigger className="w-[200px] h-9 bg-background border-primary/20">
                        <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Selecionar propriedade" />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                                <div className="flex items-center gap-2">
                                    <span>{prop.name}</span>
                                    {prop.id === selectedPropertyId && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // === ADMIN/MANAGER: Property-only selector ===
    if (effectiveMode === 'property_only' && !isSuperAdmin) {
        // Only show if there's more than one property OR we have a valid property
        if (properties.length <= 1 && displayProperty) {
            // Single property - show static badge
            return (
                <div className={cn("flex items-center gap-2", className)}>
                    <Badge variant="outline" className="h-9 px-3">
                        <Home className="h-3 w-3 mr-2 text-muted-foreground" />
                        {displayProperty.name}
                    </Badge>
                </div>
            );
        }

        // Multiple properties - show dropdown
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Select
                    value={displayPropertyId || ''}
                    onValueChange={setSelectedPropertyId}
                >
                    <SelectTrigger className="w-[200px] h-9 bg-background border-primary/20">
                        <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Selecionar propriedade" />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                                <div className="flex items-center gap-2">
                                    <span>{prop.name}</span>
                                    {prop.id === displayPropertyId && <Check className="h-4 w-4 text-primary" />}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // Hidden mode - return nothing
    return null;
};

// Compact version for header/toolbar
export const TenantSelectorCompact = ({ className }: { className?: string }) => {
    const { userRole } = useAuth();
    const { isSuperAdmin, currentOrgId, organization: currentOrg } = useOrg();
    const { selectedPropertyId, properties } = useSelectedProperty();
    const { onboarding } = useOnboardingState();

    // Staff: hidden
    if (userRole === 'staff_housekeeping' || userRole === 'staff_frontdesk' || userRole === 'viewer') {
        return null;
    }

    const currentProperty = properties.find(p => p.id === (selectedPropertyId || onboarding?.property_id));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", className)}>
                    {isSuperAdmin && currentOrg && (
                        <>
                            <Building2 className="h-4 w-4" />
                            <span className="max-w-[100px] truncate">{currentOrg.name}</span>
                            <span className="text-muted-foreground">/</span>
                        </>
                    )}
                    {currentProperty && (
                        <>
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[100px] truncate">{currentProperty.name}</span>
                        </>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[250px]">
                {isSuperAdmin && currentOrg && (
                    <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                            Organização
                        </div>
                        <DropdownMenuItem className="cursor-pointer">
                            <Building2 className="h-4 w-4 mr-2" />
                            {currentOrg.name}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                {currentProperty && (
                    <>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                            Propriedade Atual
                        </div>
                        <DropdownMenuItem className="cursor-pointer">
                            <Home className="h-4 w-4 mr-2" />
                            {currentProperty.name}
                        </DropdownMenuItem>
                    </>
                )}
                {properties.length > 1 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                            Trocar Propriedade
                        </div>
                        {properties.map((prop) => (
                            <DropdownMenuItem 
                                key={prop.id} 
                                onClick={() => setSelectedPropertyId(prop.id)}
                                className="cursor-pointer"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                {prop.name}
                                {prop.id === currentProperty?.id && <Check className="ml-auto h-4 w-4" />}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default TenantSelector;
