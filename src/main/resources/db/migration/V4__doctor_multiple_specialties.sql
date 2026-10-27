CREATE TABLE doctor_specialties (
    doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    specialty VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (doctor_id, specialty)
);

INSERT INTO doctor_specialties (doctor_id, specialty, display_order)
SELECT id, specialty, 0 FROM doctors
ON CONFLICT (doctor_id, specialty) DO NOTHING;

CREATE INDEX idx_doctor_specialties_name ON doctor_specialties(specialty);
