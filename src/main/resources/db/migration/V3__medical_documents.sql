CREATE TABLE medical_documents (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    content BYTEA NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medical_documents_appointment FOREIGN KEY (appointment_id)
        REFERENCES appointments(id) ON DELETE CASCADE,
    CONSTRAINT fk_medical_documents_uploader FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_medical_documents_appointment ON medical_documents(appointment_id);
