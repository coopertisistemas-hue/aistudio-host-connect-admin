export const ROLE_DISPLAY_NAMES: Record<string, string> = {
    admin: "Dono",
    manager: "Gerente",
    staff_frontdesk: "Recepção",
    staff_housekeeping: "Limpeza",
    viewer: "Visualizador",
    user: "Usuário", // Fallback for default 'user' role
    super_admin: "Suporte Connect", // ✅ Super admin role
};

export type RoleKey = keyof typeof ROLE_DISPLAY_NAMES;

export const getRoleDisplayName = (role: string | null | undefined): string => {
    if (!role) return "Convidado";
    return ROLE_DISPLAY_NAMES[role] || role;
};
