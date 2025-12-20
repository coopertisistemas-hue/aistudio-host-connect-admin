import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useServices, ServiceInput } from "@/hooks/useServices";
import ServiceDialog from "@/components/ServiceDialog"; // We will create this next

interface ServiceMultiSelectProps {
  propertyId: string; // Required to fetch services for a specific property
  value?: string[]; // Array of selected service IDs
  onChange: (selectedServices: string[]) => void;
  disabled?: boolean;
}

const ServiceMultiSelect = ({ propertyId, value = [], onChange, disabled }: ServiceMultiSelectProps) => {
  const { services, isLoading, createService } = useServices(propertyId);
  const [open, setOpen] = React.useState(false);
  const [newServiceDialogOpen, setNewServiceDialogOpen] = React.useState(false);

  const selectedServiceIds = new Set(value);

  const handleSelect = (serviceId: string) => {
    const newSelection = new Set(selectedServiceIds);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    onChange(Array.from(newSelection));
  };

  const handleCreateNewService = async (data: ServiceInput) => {
    try {
      const newService = await createService.mutateAsync({ ...data, property_id: propertyId });
      if (newService) {
        onChange([...value, newService.id]); // Add new service to selection
      }
      setNewServiceDialogOpen(false);
    } catch (error) {
      console.error("Failed to create new service:", error);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] flex-wrap"
            disabled={disabled || isLoading || !propertyId}
          >
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((serviceId) => {
                  const service = services.find((s) => s.id === serviceId);
                  return service ? (
                    <Badge key={service.id} variant="secondary" className="flex items-center gap-1">
                      {service.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(service.id);
                        }}
                        className="ml-1 -mr-1 h-3 w-3 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            ) : (
              <span className="text-muted-foreground">Selecione serviços...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Buscar serviço..." />
            <CommandList>
              <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
              <CommandGroup>
                {services.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.name}
                    onSelect={() => handleSelect(service.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedServiceIds.has(service.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {service.name}
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setNewServiceDialogOpen(true)} className="cursor-pointer text-primary">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar novo serviço
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ServiceDialog
        open={newServiceDialogOpen}
        onOpenChange={setNewServiceDialogOpen}
        onSubmit={handleCreateNewService}
        isLoading={createService.isPending}
        initialPropertyId={propertyId}
      />
    </>
  );
};

export default ServiceMultiSelect;