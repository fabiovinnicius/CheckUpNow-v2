package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.Specialty;
import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.DoctorRepository;
import com.checkupnow.repository.SpecialtyRepository;
import com.checkupnow.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;

    public AdminController(UserRepository userRepository, AppointmentRepository appointmentRepository,
                           DoctorRepository doctorRepository, SpecialtyRepository specialtyRepository) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(Map.of(
                "clients", userRepository.countByRole(User.ROLE_CLIENT),
                "doctorUsers", userRepository.countByRole(User.ROLE_DOCTOR),
                "doctorProfiles", doctorRepository.count(),
                "appointments", appointmentRepository.count(),
                "specialties", specialtyRepository.count()
        ));
    }

    @GetMapping("/specialties")
    public ResponseEntity<?> specialties(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(specialtyRepository.findAllByOrderByNameAsc());
    }

    @PostMapping("/specialties")
    public ResponseEntity<?> createSpecialty(@RequestBody Map<String, String> payload, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        String name = normalize(payload.get("name"));
        if (name == null) return ResponseEntity.badRequest().body(Map.of("message", "Informe o tipo de consulta."));
        if (specialtyRepository.existsByNameIgnoreCase(name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Este tipo de consulta já existe."));
        }
        return ResponseEntity.ok(specialtyRepository.save(new Specialty(name)));
    }

    @DeleteMapping("/specialties/{id}")
    public ResponseEntity<?> deleteSpecialty(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!specialtyRepository.existsById(id)) return ResponseEntity.notFound().build();
        specialtyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Tipo de consulta removido."));
    }

    @GetMapping("/users")
    public ResponseEntity<?> users(@RequestParam(defaultValue = User.ROLE_CLIENT) String role, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        String normalizedRole = role.toUpperCase(Locale.ROOT);
        if (!Set.of(User.ROLE_CLIENT, User.ROLE_DOCTOR).contains(normalizedRole)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo de usuário inválido."));
        }
        return ResponseEntity.ok(userRepository.findByRoleOrderByNameAsc(normalizedRole));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        var user = userRepository.findById(id);
        if (user.isEmpty()) return ResponseEntity.notFound().build();
        if (User.ROLE_ADMIN.equals(user.get().getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Administradores não podem ser excluídos por esta tela."));
        }
        appointmentRepository.deleteByUserId(id);
        userRepository.delete(user.get());
        return ResponseEntity.ok(Map.of("message", "Perfil excluído com sucesso."));
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> doctors(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!doctorRepository.existsById(id)) return ResponseEntity.notFound().build();
        doctorRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Perfil médico excluído."));
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> appointments(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(appointmentRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        Long patientId = numberAsLong(payload.get("patientId"));
        String doctorName = normalize((String) payload.get("doctorName"));
        String specialty = normalize((String) payload.get("specialty"));
        String dateValue = normalize((String) payload.get("appointmentDate"));
        String timeValue = normalize((String) payload.get("appointmentTime"));
        if (patientId == null || doctorName == null || specialty == null || dateValue == null || timeValue == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Preencha paciente, consulta, médico, data e horário."));
        }
        var patient = userRepository.findById(patientId)
                .filter(user -> User.ROLE_CLIENT.equals(user.getRole()));
        if (patient.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Paciente inválido."));

        LocalDate date;
        LocalTime time;
        try {
            date = LocalDate.parse(dateValue, DateTimeFormatter.ISO_LOCAL_DATE);
            time = LocalTime.parse(timeValue, DateTimeFormatter.ISO_LOCAL_TIME);
        } catch (DateTimeParseException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Data ou horário inválido."));
        }
        ZonedDateTime now = ZonedDateTime.now(ZONE);
        ZonedDateTime requested = ZonedDateTime.of(date, time, ZONE);
        if (!requested.isAfter(now) || requested.isAfter(now.plusYears(1))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Escolha um horário futuro dentro de um ano."));
        }
        String displayDate = date.format(DISPLAY_DATE);
        String displayTime = time.format(DateTimeFormatter.ofPattern("HH:mm"));
        if (appointmentRepository.existsByDoctorNameAndAppointmentDateAndAppointmentTimeAndStatusNot(
                doctorName, displayDate, displayTime, "CANCELADO")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "O médico já possui uma consulta neste horário."));
        }
        Appointment appointment = new Appointment(patient.get(), doctorName, specialty, displayDate, displayTime,
                normalize((String) payload.get("observation")));
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setStatus("CANCELADO");
            return ResponseEntity.ok((Object) appointmentRepository.save(appointment));
        }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        return userId != null && userRepository.findById(userId)
                .map(user -> User.ROLE_ADMIN.equals(user.getRole())).orElse(false);
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acesso restrito a administradores."));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Long numberAsLong(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }
}
