CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "booking_check_dates"
CHECK ("checkOut" > "checkIn");

ALTER TABLE "Booking"
ADD CONSTRAINT "booking_no_overlap"
EXCLUDE USING gist (
  "roomId" WITH =,
  tsrange("checkIn", "checkOut", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED');