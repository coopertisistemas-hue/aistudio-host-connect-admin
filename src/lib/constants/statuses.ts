/**
 * Canonical Booking and Room Status Definitions
 * Single source of truth for status management across HostConnect Admin
 */

// ============================================================================
// BOOKING STATUSES
// ============================================================================

export enum BookingStatus {
    RESERVED = 'reserved',
    PRE_CHECKIN = 'pre_checkin',
    CHECKED_IN = 'checked_in',
    IN_HOUSE = 'in_house',
    CHECKED_OUT = 'checked_out',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    [BookingStatus.RESERVED]: 'Reservado',
    [BookingStatus.PRE_CHECKIN]: 'Pré-Check-in',
    [BookingStatus.CHECKED_IN]: 'Check-in Realizado',
    [BookingStatus.IN_HOUSE]: 'Hospedado',
    [BookingStatus.CHECKED_OUT]: 'Check-out Realizado',
    [BookingStatus.CANCELLED]: 'Cancelado',
    [BookingStatus.NO_SHOW]: 'Não Compareceu',
};

// ============================================================================
// ROOM STATUSES
// ============================================================================

export enum RoomStatus {
    CLEAN = 'clean',
    DIRTY = 'dirty',
    INSPECTED = 'inspected',
    OUT_OF_ORDER = 'out_of_order',
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
    [RoomStatus.CLEAN]: 'Limpo',
    [RoomStatus.DIRTY]: 'Sujo',
    [RoomStatus.INSPECTED]: 'Inspecionado',
    [RoomStatus.OUT_OF_ORDER]: 'Fora de Operação',
};

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Check if a booking represents an active stay (guest is currently in the property)
 */
export const isActiveStay = (status: BookingStatus): boolean => {
    return status === BookingStatus.CHECKED_IN || status === BookingStatus.IN_HOUSE;
};

/**
 * Check if a booking is in a pre-arrival state
 */
export const isPreArrival = (status: BookingStatus): boolean => {
    return status === BookingStatus.RESERVED || status === BookingStatus.PRE_CHECKIN;
};

/**
 * Check if a booking has been completed (guest has left)
 */
export const isCompleted = (status: BookingStatus): boolean => {
    return status === BookingStatus.CHECKED_OUT;
};

/**
 * Check if a booking is in a terminal state (no further transitions expected)
 */
export const isTerminal = (status: BookingStatus): boolean => {
    return (
        status === BookingStatus.CHECKED_OUT ||
        status === BookingStatus.CANCELLED ||
        status === BookingStatus.NO_SHOW
    );
};

/**
 * Check if a booking is valid for check-in
 */
export const canCheckIn = (status: BookingStatus): boolean => {
    return isPreArrival(status);
};

/**
 * Check if a booking is valid for check-out
 */
export const canCheckOut = (status: BookingStatus): boolean => {
    return isActiveStay(status);
};

/**
 * Check if a booking can be cancelled
 */
export const canCancel = (status: BookingStatus): boolean => {
    return !isTerminal(status);
};

/**
 * Check if a room needs cleaning
 */
export const needsCleaning = (status: RoomStatus): boolean => {
    return status === RoomStatus.DIRTY;
};

/**
 * Check if a room is ready for guest occupancy
 */
export const isRoomReady = (status: RoomStatus): boolean => {
    return status === RoomStatus.CLEAN || status === RoomStatus.INSPECTED;
};

/**
 * Check if a room is unavailable
 */
export const isRoomUnavailable = (status: RoomStatus): boolean => {
    return status === RoomStatus.OUT_OF_ORDER;
};

// ============================================================================
// HELPER FUNCTIONS FOR UI
// ============================================================================

/**
 * Get the PT-BR label for a booking status
 */
export const getBookingStatusLabel = (status: string): string => {
    return BOOKING_STATUS_LABELS[status as BookingStatus] || status;
};

/**
 * Get the PT-BR label for a room status
 */
export const getRoomStatusLabel = (status: string): string => {
    return ROOM_STATUS_LABELS[status as RoomStatus] || status;
};

/**
 * Get all booking statuses as an array
 */
export const getAllBookingStatuses = (): BookingStatus[] => {
    return Object.values(BookingStatus);
};

/**
 * Get all room statuses as an array
 */
export const getAllRoomStatuses = (): RoomStatus[] => {
    return Object.values(RoomStatus);
};
