CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20),
    birth_date VARCHAR(255),
    cep VARCHAR(255),
    cpf VARCHAR(255),
    phone VARCHAR(255),
    gender VARCHAR(255),
    health_plan VARCHAR(255),
    has_chronic_disease BOOLEAN,
    takes_continuous_medication BOOLEAN,
    avatar_url VARCHAR(500000)
);

CREATE TABLE specialties (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE doctors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    crm VARCHAR(255),
    user_id BIGINT UNIQUE REFERENCES users(id)
);

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    appointment_date VARCHAR(255) NOT NULL,
    appointment_time VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    observation VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE doctor_working_hours (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id),
    day_of_week VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT uk_doctor_working_day UNIQUE (doctor_id, day_of_week)
);

CREATE TABLE doctor_blocks (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_working_hours_doctor ON doctor_working_hours(doctor_id);
CREATE INDEX idx_doctor_blocks_doctor ON doctor_blocks(doctor_id);
