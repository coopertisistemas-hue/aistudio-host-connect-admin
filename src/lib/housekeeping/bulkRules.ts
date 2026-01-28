export type BulkAction = 'cleaning' | 'clean' | 'inspected';

type RoomLike = {
  status: string;
};

interface BulkActionState {
  canApply: boolean;
  helper?: string;
}

export const getBulkActionState = (rooms: RoomLike[], action: BulkAction | ''): BulkActionState => {
  if (!action) {
    return { canApply: false, helper: 'Selecione uma ação.' };
  }

  if (rooms.length === 0) {
    return { canApply: false, helper: 'Selecione ao menos um quarto.' };
  }

  if (rooms.some((room) => room.status === 'out_of_order')) {
    return { canApply: false, helper: 'Alguns quartos estão fora de serviço.' };
  }

  if (action === 'cleaning') {
    const invalid = rooms.some((room) => room.status !== 'dirty');
    return invalid
      ? { canApply: false, helper: 'Iniciar limpeza exige status “Pendentes”.' }
      : { canApply: true };
  }

  if (action === 'clean') {
    const invalid = rooms.some((room) => room.status !== 'cleaning');
    return invalid
      ? { canApply: false, helper: 'Marcar como limpo exige status “Em limpeza”.' }
      : { canApply: true };
  }

  if (action === 'inspected') {
    const invalid = rooms.some((room) => room.status !== 'clean');
    return invalid
      ? { canApply: false, helper: 'A revisão só pode ser aplicada em quartos “Limpos”.' }
      : { canApply: true };
  }

  return { canApply: true };
};
