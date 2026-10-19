package com.checkupnow.repository;

import com.checkupnow.model.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {
    List<MedicalDocument> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);
}
