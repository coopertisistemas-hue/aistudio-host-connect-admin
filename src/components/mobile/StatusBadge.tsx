import React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusBadge: Consistent status indicator for lists
 */
export const StatusBadge: React.FC<{
    status: 'pending' | 'cleaning' | 'completed' | 'inspected' | 'maintenance' | 'occupied' | 'vacant' | 'reserved' | string;
    className?: string;
}> = ({ status, className }) => {
    let colorClass = "bg-neutral-100 text-neutral-500 border-neutral-200";
    let label = status;

    switch (status) {
        case 'pending':
        case 'dirty':
            colorClass = "bg-rose-50 text-rose-600 border-rose-100";
            label = "Sujo";
            break;
        case 'cleaning':
            colorClass = "bg-amber-50 text-amber-600 border-amber-100";
            label = "Limpando";
            break;
        case 'completed':
            colorClass = "bg-blue-50 text-blue-600 border-blue-100";
            label = "Pronto";
            break;
        case 'inspected':
        case 'clean':
            colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
            label = "Liberado";
            break;
        case 'maintenance':
            colorClass = "bg-red-50 text-red-600 border-red-100";
            label = "Manutenção";
            break;
        case 'occupied':
            colorClass = "bg-indigo-50 text-indigo-600 border-indigo-100";
            label = "Ocupado";
            break;
        case 'reserved':
            colorClass = "bg-purple-50 text-purple-600 border-purple-100";
            label = "Reservado";
            break;
        default:
            // Try to handle other status variations simplistically or keep default
            if (status === 'washing') {
                colorClass = "bg-cyan-50 text-cyan-600 border-cyan-100";
                label = "Lavando";
            } else if (status === 'ready') {
                colorClass = "bg-indigo-50 text-indigo-600 border-indigo-100";
                label = "Pronto";
            } else if (status === 'delivered') {
                colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                label = "Entregue";
            }
            break;
    }

    return (
        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", colorClass, className)}>
            {label}
        </span>
    );
};
