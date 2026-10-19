package com.checkupnow.dto;

import com.checkupnow.model.MedicalDocument;

import java.time.LocalDateTime;

public record MedicalDocumentResponse(Long id, Long appointmentId, String type, String title,
                                      String fileName, Long fileSize, LocalDateTime createdAt,
                                      String uploadedByName, String downloadUrl) {
    public static MedicalDocumentResponse from(MedicalDocument document) {
        return new MedicalDocumentResponse(document.getId(), document.getAppointment().getId(),
                document.getType(), document.getTitle(), document.getFileName(), document.getFileSize(),
                document.getCreatedAt(), document.getUploadedBy() == null ? "Sistema" : document.getUploadedBy().getName(),
                "/api/medical-documents/" + document.getId() + "/download");
    }
}
