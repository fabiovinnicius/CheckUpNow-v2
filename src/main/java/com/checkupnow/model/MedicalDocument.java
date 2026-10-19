package com.checkupnow.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_documents")
public class MedicalDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_user_id")
    private User uploadedBy;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private byte[] content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected MedicalDocument() {}

    public MedicalDocument(Appointment appointment, User uploadedBy, String type, String title,
                           String fileName, String contentType, byte[] content) {
        this.appointment = appointment;
        this.uploadedBy = uploadedBy;
        this.type = type;
        this.title = title;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = (long) content.length;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public User getUploadedBy() { return uploadedBy; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public Long getFileSize() { return fileSize; }
    public byte[] getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
