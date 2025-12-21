import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useStaff } from "@/hooks/useStaff";
import { OperationPageTemplate } from "@/components/OperationPageTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Phone, Mail, Shield } from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const StaffManagementPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { staff, isLoading } = useStaff(selectedPropertyId!);

    if (isLoading) return <DataTableSkeleton />;

    return (
        <OperationPageTemplate
            title="Colaboradores"
            subtitle="Gestão da equipe e permissões"
            headerIcon={<Users className="h-6 w-6 text-primary" />}
        >
            <div className="flex justify-end mb-4">
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Colaborador
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member) => (
                    <Card key={member.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {member.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">{member.name}</h3>
                                        <Badge variant="outline" className="text-[8px] uppercase font-bold py-0 h-4">
                                            {member.role}
                                        </Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>

                            <div className="space-y-1.5 border-t pt-3">
                                {member.phone && (
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Phone className="h-3 w-3" /> {member.phone}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <Users className="h-3 w-3" /> {member.departments.length} Departamentos
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="w-full text-[10px] h-8 font-bold">Editar</Button>
                                <Button variant="outline" size="sm" className="w-full text-[10px] h-8 font-bold text-destructive">Arquivar</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </OperationPageTemplate>
    );
};

export default StaffManagementPage;
