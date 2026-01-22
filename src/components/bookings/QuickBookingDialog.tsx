import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useProperties } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, User } from "lucide-react";
import { debounce } from "lodash";

// Form schema with validation
const quickBookingSchema = z.object({
    property_id: z.string().min(1, "Selecione uma propriedade"),
    check_in: z.string().min(1, "Data de check-in obrigatória"),
    check_out: z.string().min(1, "Data de check-out obrigatória"),
    guest_name: z.string().min(1, "Nome do hóspede obrigatório"),
    guest_document: z.string().optional(),
    guest_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    guest_phone: z.string().optional(),
    adults_count: z.number().min(1, "Mínimo 1 adulto").optional(),
    children_count: z.number().min(0).optional(),
    marketing_consent: z.boolean().default(false),
}).refine(
    (data) => {
        // At least one identifier required
        const hasIdentifier = !!(data.guest_document?.trim() || data.guest_email?.trim() || data.guest_phone?.trim());
        return hasIdentifier;
    },
    {
        message: "Documento, e-mail ou telefone é obrigatório",
        path: ["guest_document"],
    }
).refine(
    (data) => {
        // Check-out must be after check-in
        return data.check_out > data.check_in;
    },
    {
        message: "Check-out deve ser após o check-in",
        path: ["check_out"],
    }
);

type QuickBookingFormData = z.infer<typeof quickBookingSchema>;

interface QuickBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface FoundGuest {
    id: string;
    full_name: string;
    document?: string;
    email?: string;
    phone?: string;
}

export const QuickBookingDialog = ({ open, onOpenChange }: QuickBookingDialogProps) => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { currentOrgId } = useOrg();
    const { properties } = useProperties();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const isViewer = userRole === 'viewer';

    const [isLookingUp, setIsLookingUp] = useState(false);
    const [foundGuest, setFoundGuest] = useState<FoundGuest | null>(null);

    const form = useForm<QuickBookingFormData>({
        resolver: zodResolver(quickBookingSchema),
        defaultValues: {
            property_id: "",
            check_in: "",
            check_out: "",
            guest_name: "",
            guest_document: "",
            guest_email: "",
            guest_phone: "",
            adults_count: 1,
            children_count: 0,
            marketing_consent: false,
        },
    });

    // Smart guest lookup with debounce
    const lookupGuest = useCallback(
        async (searchTerm: string, field: 'document' | 'email' | 'phone') => {
            if (!searchTerm || searchTerm.length < 3 || !currentOrgId) {
                setFoundGuest(null);
                return;
            }

            setIsLookingUp(true);

            try {
                let query = supabase
                    .from('guests')
                    .select('id, full_name, document, email, phone')
                    .eq('org_id', currentOrgId);

                // Match strategy: exact match on the field being typed
                if (field === 'document') {
                    query = query.eq('document', searchTerm);
                } else if (field === 'email') {
                    query = query.ilike('email', searchTerm);
                } else if (field === 'phone') {
                    query = query.eq('phone', searchTerm);
                }

                const { data, error } = await query.limit(1).maybeSingle();

                if (error) {
                    console.warn('[QuickBooking] Guest lookup error:', error);
                    setFoundGuest(null);
                } else if (data) {
                    setFoundGuest(data);
                } else {
                    setFoundGuest(null);
                }
            } catch (err) {
                console.warn('[QuickBooking] Guest lookup failed:', err);
                setFoundGuest(null);
            } finally {
                setIsLookingUp(false);
            }
        },
        [currentOrgId]
    );

    // Debounced lookup functions
    const debouncedLookupDocument = useMemo(
        () => debounce((value: string) => lookupGuest(value, 'document'), 400),
        [lookupGuest]
    );

    const debouncedLookupEmail = useMemo(
        () => debounce((value: string) => lookupGuest(value, 'email'), 400),
        [lookupGuest]
    );

    const debouncedLookupPhone = useMemo(
        () => debounce((value: string) => lookupGuest(value, 'phone'), 400),
        [lookupGuest]
    );

    // Autofill from found guest
    const handleUseFoundGuest = () => {
        if (!foundGuest) return;

        form.setValue('guest_name', foundGuest.full_name);
        if (foundGuest.document) form.setValue('guest_document', foundGuest.document);
        if (foundGuest.email) form.setValue('guest_email', foundGuest.email);
        if (foundGuest.phone) form.setValue('guest_phone', foundGuest.phone);

        toast({
            title: "Dados carregados",
            description: "Informações do hóspede preenchidas automaticamente.",
        });
    };

    // Create quick booking mutation
    const createQuickBooking = useMutation({
        mutationFn: async (data: QuickBookingFormData) => {
            if (!currentOrgId) throw new Error('Organização não encontrada');

            // Step 1: Upsert guest
            let guestId: string;

            // Try to find existing guest
            let existingGuest = null;
            if (data.guest_document) {
                const { data: guest } = await supabase
                    .from('guests')
                    .select('id')
                    .eq('org_id', currentOrgId)
                    .eq('document', data.guest_document)
                    .maybeSingle();
                existingGuest = guest;
            } else if (data.guest_email) {
                const { data: guest } = await supabase
                    .from('guests')
                    .select('id')
                    .eq('org_id', currentOrgId)
                    .ilike('email', data.guest_email)
                    .maybeSingle();
                existingGuest = guest;
            } else if (data.guest_phone) {
                const { data: guest } = await supabase
                    .from('guests')
                    .select('id')
                    .eq('org_id', currentOrgId)
                    .eq('phone', data.guest_phone)
                    .maybeSingle();
                existingGuest = guest;
            }

            if (existingGuest) {
                // Update existing guest
                guestId = existingGuest.id;
                await supabase
                    .from('guests')
                    .update({
                        full_name: data.guest_name,
                        document: data.guest_document || null,
                        email: data.guest_email || null,
                        phone: data.guest_phone || null,
                    })
                    .eq('id', guestId);
            } else {
                // Create new guest
                const { data: newGuest, error: guestError } = await supabase
                    .from('guests')
                    .insert({
                        org_id: currentOrgId,
                        full_name: data.guest_name,
                        document: data.guest_document || null,
                        email: data.guest_email || null,
                        phone: data.guest_phone || null,
                    })
                    .select('id')
                    .single();

                if (guestError) throw guestError;
                guestId = newGuest.id;
            }

            // Step 2: Create booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    org_id: currentOrgId,
                    property_id: data.property_id,
                    check_in: data.check_in,
                    check_out: data.check_out,
                    guest_name: data.guest_name,
                    guest_email: data.guest_email || null,
                    guest_document: data.guest_document || null,
                    guest_phone: data.guest_phone || null,
                    total_guests: (data.adults_count || 1) + (data.children_count || 0),
                    status: 'reserved',
                })
                .select('id')
                .single();

            if (bookingError) throw bookingError;

            // Step 3: Create booking_guests link (primary guest)
            const { error: linkError } = await supabase
                .from('booking_guests')
                .insert({
                    org_id: currentOrgId,
                    booking_id: booking.id,
                    guest_id: guestId,
                    is_primary: true,
                });

            if (linkError) throw linkError;

            // Step 4: Create consent record if marketing consent is explicitly set
            if (data.marketing_consent !== undefined) {
                await supabase
                    .from('guest_consents')
                    .insert({
                        org_id: currentOrgId,
                        guest_id: guestId,
                        type: 'marketing',
                        granted: data.marketing_consent,
                        source: 'reception',
                        metadata: { quick_booking: true, booking_id: booking.id },
                    });
            }

            return booking.id;
        },
        onSuccess: (bookingId) => {
            queryClient.invalidateQueries({ queryKey: ['frontdesk-arrivals'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            toast({
                title: "Reserva criada",
                description: "Navegando para o folio...",
            });

            onOpenChange(false);
            form.reset();
            setFoundGuest(null);

            // Navigate to folio
            navigate(`/operation/folio/${bookingId}`);
        },
        onError: (error) => {
            console.error('[QuickBooking] Create error:', error);
            toast({
                title: "Erro ao criar reserva",
                description: "Não foi possível criar a reserva. Tente novamente.",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: QuickBookingFormData) => {
        createQuickBooking.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Reserva Rápida</DialogTitle>
                    <DialogDescription>
                        Preencha os dados essenciais para criar uma reserva rapidamente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Property Selector */}
                        <FormField
                            control={form.control}
                            name="property_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Propriedade *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a propriedade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {properties.map((prop) => (
                                                <SelectItem key={prop.id} value={prop.id}>
                                                    {prop.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Check-in / Check-out */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="check_in"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Check-in *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="check_out"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Check-out *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Guest Name */}
                        <FormField
                            control={form.control}
                            name="guest_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Hóspede *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Guest Identifiers */}
                        <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                            <p className="text-sm font-medium">
                                Identificação do Hóspede <span className="text-muted-foreground">(pelo menos um)</span>
                            </p>

                            {/* Found Guest Banner */}
                            {foundGuest && (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900">Hóspede encontrado</p>
                                        <p className="text-xs text-green-700">{foundGuest.full_name}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleUseFoundGuest}
                                        className="text-xs"
                                    >
                                        <User className="h-3 w-3 mr-1" />
                                        Usar dados
                                    </Button>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="guest_document"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF/Documento</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="000.000.000-00"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        debouncedLookupDocument(e.target.value);
                                                    }}
                                                />
                                                {isLookingUp && (
                                                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="guest_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="exemplo@email.com"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    debouncedLookupEmail(e.target.value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="guest_phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    debouncedLookupPhone(e.target.value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Adults / Children */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="adults_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adultos</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="children_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crianças</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* LGPD Consent */}
                        <div className="space-y-3 border rounded-lg p-4">
                            <p className="text-sm font-medium">Consentimentos (LGPD)</p>

                            <FormField
                                control={form.control}
                                name="marketing_consent"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-normal">
                                                Aceita receber mensagens e promoções
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                Marketing e comunicações comerciais
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={createQuickBooking.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isViewer || createQuickBooking.isPending || !form.formState.isValid}
                            >
                                {createQuickBooking.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Criar Reserva
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
