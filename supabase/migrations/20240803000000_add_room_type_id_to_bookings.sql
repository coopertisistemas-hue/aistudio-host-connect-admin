ALTER TABLE public.bookings
ADD COLUMN room_type_id uuid NULL;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_room_type_id_fkey
FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE SET NULL;

-- Opcional: Adicionar um índice para melhorar a performance das consultas
CREATE INDEX bookings_room_type_id_idx ON public.bookings (room_type_id);