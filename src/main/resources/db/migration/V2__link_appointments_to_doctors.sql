ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_id BIGINT;

UPDATE appointments appointment
SET doctor_id = (
    SELECT MIN(doctor.id)
    FROM doctors doctor
    WHERE LOWER(TRIM(appointment.doctor_name)) = LOWER(TRIM(doctor.name))
)
WHERE appointment.doctor_id IS NULL
  AND EXISTS (
      SELECT 1 FROM doctors doctor
      WHERE LOWER(TRIM(appointment.doctor_name)) = LOWER(TRIM(doctor.name))
  );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_doctor'
    ) THEN
        ALTER TABLE appointments
            ADD CONSTRAINT fk_appointments_doctor
            FOREIGN KEY (doctor_id) REFERENCES doctors(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
