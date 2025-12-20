import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, X } from "lucide-react"; // Added X import

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
import { useAmenities } from "@/hooks/useAmenities";
import AmenityDialog from "@/components/AmenityDialog";
import { AmenityInput } from "@/hooks/useAmenities";

interface AmenityMultiSelectProps {
  value?: string[]; // Array of selected amenity IDs
  onChange: (selectedAmenities: string[]) => void;
  disabled?: boolean;
}

const AmenityMultiSelect = ({ value = [], onChange, disabled }: AmenityMultiSelectProps) => {
  const { amenities, isLoading, createAmenity } = useAmenities();
  const [open, setOpen] = React.useState(false);
  const [newAmenityDialogOpen, setNewAmenityDialogOpen] = React.useState(false);

  const selectedAmenityIds = new Set(value);

  const handleSelect = (amenityId: string) => {
    const newSelection = new Set(selectedAmenityIds);
    if (newSelection.has(amenityId)) {
      newSelection.delete(amenityId);
    } else {
      newSelection.add(amenityId);
    }
    onChange(Array.from(newSelection));
  };

  const handleCreateNewAmenity = async (data: AmenityInput) => {
    try {
      const newAmenity = await createAmenity.mutateAsync(data);
      if (newAmenity) {
        onChange([...value, newAmenity.id]); // Add new amenity to selection
      }
      setNewAmenityDialogOpen(false);
    } catch (error) {
      console.error("Failed to create new amenity:", error);
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
            disabled={disabled || isLoading}
          >
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((amenityId) => {
                  const amenity = amenities.find((a) => a.id === amenityId);
                  return amenity ? (
                    <Badge key={amenity.id} variant="secondary" className="flex items-center gap-1">
                      {amenity.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(amenity.id);
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
              <span className="text-muted-foreground">Selecione comodidades...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Buscar comodidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma comodidade encontrada.</CommandEmpty>
              <CommandGroup>
                {amenities.map((amenity) => (
                  <CommandItem
                    key={amenity.id}
                    value={amenity.name}
                    onSelect={() => handleSelect(amenity.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAmenityIds.has(amenity.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {amenity.name}
                  </CommandItem>
                ))}
                <CommandItem onSelect={() => setNewAmenityDialogOpen(true)} className="cursor-pointer text-primary">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar nova comodidade
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AmenityDialog
        open={newAmenityDialogOpen}
        onOpenChange={setNewAmenityDialogOpen}
        onSubmit={handleCreateNewAmenity}
        isLoading={createAmenity.isPending}
      />
    </>
  );
};

export default AmenityMultiSelect;