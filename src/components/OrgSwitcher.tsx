import { Building2, Check } from 'lucide-react';
import { useOrg } from '@/hooks/useOrg';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const OrgSwitcher = () => {
    const { isSuperAdmin, allOrganizations, currentOrgId, setSelectedOrgId } = useOrg();

    // Only show for super admins
    if (!isSuperAdmin) return null;

    // No organizations available
    if (!allOrganizations || allOrganizations.length === 0) {
        return (
            <div className="px-3 py-2 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground">Nenhuma organização disponível</p>
            </div>
        );
    }

    const currentOrg = allOrganizations.find(org => org.id === currentOrgId);

    return (
        <div className="space-y-2">
            {/* Super Admin Badge */}
            <div className="flex items-center justify-center">
                <Badge
                    variant="default"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider shadow-md"
                >
                    🔑 Suporte Connect
                </Badge>
            </div>

            {/* Org Selector */}
            <Select
                value={currentOrgId || ''}
                onValueChange={setSelectedOrgId}
            >
                <SelectTrigger className="w-full h-10 bg-background hover:bg-accent/50 transition-colors border-primary/20">
                    <div className="flex items-center gap-2 w-full">
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <SelectValue placeholder="Selecione uma organização" />
                    </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {allOrganizations.map((org) => (
                        <SelectItem
                            key={org.id}
                            value={org.id}
                            className={cn(
                                "cursor-pointer",
                                org.id === currentOrgId && "bg-primary/10"
                            )}
                        >
                            <div className="flex items-center justify-between w-full gap-2">
                                <span className="truncate">{org.name}</span>
                                {org.id === currentOrgId && (
                                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Current Org Info */}
            {currentOrg && (
                <div className="px-2 py-1.5 bg-muted/50 rounded-md border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        Contexto Atual
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                        {currentOrg.name}
                    </p>
                </div>
            )}

            {/* Org Count */}
            <div className="text-center">
                <p className="text-[10px] text-muted-foreground">
                    {allOrganizations.length} {allOrganizations.length === 1 ? 'organização' : 'organizações'} disponíveis
                </p>
            </div>
        </div>
    );
};
