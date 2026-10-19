package com.checkupnow.controller;

import com.checkupnow.dto.MedicalDocumentResponse;
import com.checkupnow.model.*;
import com.checkupnow.repository.*;
import com.checkupnow.service.AppointmentStatusService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/medical-documents")
@Transactional
public class MedicalDocumentController {
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("ATESTADO", "RECEITA", "EXAME", "OUTRO");

    private final MedicalDocumentRepository documentRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentStatusService statusService;

    public MedicalDocumentController(MedicalDocumentRepository documentRepository,
                                     AppointmentRepository appointmentRepository,
                                     UserRepository userRepository,
                                     DoctorRepository doctorRepository,
                                     AppointmentStatusService statusService) {
        this.documentRepository = documentRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.statusService = statusService;
    }

    @GetMapping("/appointments/{appointmentId}")
    public ResponseEntity<?> list(@PathVariable Long appointmentId, HttpSession session) {
        Access access = access(session, appointmentId);
        if (access.user() == null) return unauthorized();
        if (access.appointment() == null || !canView(access)) return forbidden();
        return ResponseEntity.ok(documentRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId)
                .stream().map(MedicalDocumentResponse::from).toList());
    }

    @PostMapping(value = "/appointments/{appointmentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable Long appointmentId,
                                    @RequestParam String type,
                                    @RequestParam(required = false) String title,
                                    @RequestPart MultipartFile file,
                                    HttpSession session) {
        Access access = access(session, appointmentId);
        if (access.user() == null) return unauthorized();
        if (access.appointment() == null || !canUpload(access)) return forbidden();

        Appointment appointment = statusService.refreshCompleted(List.of(access.appointment())).getFirst();
        if (!"CONCLUIDO".equals(appointment.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Documentos só podem ser enviados após a consulta ser concluída."));
        }

        String normalizedType = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        if (!TYPES.contains(normalizedType)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Selecione um tipo de documento válido."));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Selecione um arquivo PDF."));
        }
        if (!MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(file.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Apenas arquivos PDF são permitidos."));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("message", "O PDF deve ter no máximo 5 MB."));
        }

        try {
            byte[] content = file.getBytes();
            if (!isPdf(content)) {
                return ResponseEntity.badRequest().body(Map.of("message", "O arquivo enviado não é um PDF válido."));
            }
            String originalName = safeFileName(file.getOriginalFilename());
            String normalizedTitle = normalize(title);
            if (normalizedTitle == null) normalizedTitle = originalName;
            if (normalizedTitle.length() > 150) normalizedTitle = normalizedTitle.substring(0, 150);
            MedicalDocument saved = documentRepository.save(new MedicalDocument(appointment, access.user(),
                    normalizedType, normalizedTitle, originalName, MediaType.APPLICATION_PDF_VALUE, content));
            return ResponseEntity.ok(MedicalDocumentResponse.from(saved));
        } catch (IOException exception) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Não foi possível salvar o PDF."));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id, HttpSession session) {
        Optional<MedicalDocument> document = documentRepository.findById(id);
        if (document.isEmpty()) return ResponseEntity.notFound().build();
        Access access = access(session, document.get().getAppointment().getId());
        if (access.user() == null) return unauthorized();
        if (!canView(access)) return forbidden();

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(document.get().getFileName(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(document.get().getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(document.get().getContent());
    }

    private Access access(HttpSession session, Long appointmentId) {
        Object rawUserId = session.getAttribute("userId");
        if (!(rawUserId instanceof Long userId)) return new Access(null, null, null);
        User user = userRepository.findById(userId).orElse(null);
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        Doctor doctor = user != null && User.ROLE_DOCTOR.equals(user.getRole())
                ? doctorRepository.findByUserId(userId).orElse(null) : null;
        return new Access(user, appointment, doctor);
    }

    private boolean canView(Access access) {
        if (User.ROLE_ADMIN.equals(access.user().getRole())) return true;
        if (User.ROLE_CLIENT.equals(access.user().getRole())) {
            return access.appointment().getUser().getId().equals(access.user().getId());
        }
        return access.doctor() != null && access.appointment().getDoctor() != null
                && access.appointment().getDoctor().getId().equals(access.doctor().getId());
    }

    private boolean canUpload(Access access) {
        return User.ROLE_ADMIN.equals(access.user().getRole())
                || (User.ROLE_DOCTOR.equals(access.user().getRole()) && canView(access));
    }

    private String safeFileName(String value) {
        String name = value == null ? "documento-medico.pdf" : value.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._-]", "_");
        return name.isBlank() ? "documento-medico.pdf" : name;
    }

    private boolean isPdf(byte[] content) {
        return content.length >= 5 && content[0] == '%' && content[1] == 'P'
                && content[2] == 'D' && content[3] == 'F' && content[4] == '-';
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Você não possui acesso aos documentos desta consulta."));
    }

    private record Access(User user, Appointment appointment, Doctor doctor) {}
}
