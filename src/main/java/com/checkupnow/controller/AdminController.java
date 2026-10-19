package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.dto.AppointmentResponse;
import com.checkupnow.model.Specialty;
import com.checkupnow.model.User;
import com.checkupnow.model.Doctor;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.DoctorBlockRepository;
import com.checkupnow.repository.DoctorWorkingHourRepository;
import com.checkupnow.repository.DoctorRepository;
import com.checkupnow.repository.SpecialtyRepository;
import com.checkupnow.repository.UserRepository;
import com.checkupnow.service.DoctorScheduleService;
import com.checkupnow.service.AppointmentStatusService;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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
    private final DoctorScheduleService scheduleService;
    private final DoctorWorkingHourRepository workingHourRepository;
    private final DoctorBlockRepository blockRepository;
    private final AppointmentStatusService statusService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminController(UserRepository userRepository, AppointmentRepository appointmentRepository,
                           DoctorRepository doctorRepository, SpecialtyRepository specialtyRepository,
                           DoctorScheduleService scheduleService,
                           DoctorWorkingHourRepository workingHourRepository,
                           DoctorBlockRepository blockRepository,
                           AppointmentStatusService statusService) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
        this.scheduleService = scheduleService;
        this.workingHourRepository = workingHourRepository;
        this.blockRepository = blockRepository;
        this.statusService = statusService;
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
        return ResponseEntity.ok(userRepository.findByRoleOrderByNameAsc(normalizedRole).stream()
                .map(user -> Map.of(
                        "id", (Object) user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "phone", user.getPhone() == null ? "" : user.getPhone(),
                        "role", user.getRole()))
                .toList());
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

    @PostMapping("/doctors")
    @Transactional
    public ResponseEntity<?> createDoctor(@RequestBody Map<String, String> payload, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        String name = normalize(payload.get("name"));
        String specialty = normalize(payload.get("specialty"));
        String crm = normalize(payload.get("crm"));
        String email = normalize(payload.get("email"));
        String password = payload.get("password");
        if (name == null || specialty == null || crm == null || email == null
                || password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Preencha nome, especialidade, CRM, e-mail e uma senha com ao menos 8 caracteres."));
        }
        if (!specialtyRepository.existsByNameIgnoreCase(specialty)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Selecione um tipo de consulta cadastrado."));
        }
        if (doctorRepository.existsByNameAndSpecialty(name, specialty)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Este médico já está cadastrado."));
        }
        email = email.toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "E-mail já cadastrado."));
        }

        User account = new User(name, email, passwordEncoder.encode(password));
        account.setRole(User.ROLE_DOCTOR);
        account = userRepository.save(account);
        Doctor doctor = new Doctor(name, specialty, crm);
        doctor.setUser(account);
        doctor = doctorRepository.save(doctor);
        List<Map<String, String>> defaultHours = List.of(
                hour("MONDAY"), hour("TUESDAY"), hour("WEDNESDAY"), hour("THURSDAY"), hour("FRIDAY"));
        scheduleService.replaceWorkingHours(doctor, defaultHours);
        return ResponseEntity.status(HttpStatus.CREATED).body(doctor);
    }

    @DeleteMapping("/doctors/{id}")
    @Transactional
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!doctorRepository.existsById(id)) return ResponseEntity.notFound().build();
        if (appointmentRepository.existsByDoctorId(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "Este médico possui consultas vinculadas e não pode ser excluído."));
        }
        Doctor doctor = doctorRepository.findById(id).orElseThrow();
        workingHourRepository.deleteByDoctorId(id);
        blockRepository.deleteByDoctorId(id);
        User account = doctor.getUser();
        doctorRepository.delete(doctor);
        if (account != null) userRepository.delete(account);
        return ResponseEntity.ok(Map.of("message", "Perfil médico excluído."));
    }

    @PostMapping("/doctors/{id}/account")
    public ResponseEntity<?> createDoctorAccount(@PathVariable Long id, @RequestBody Map<String, String> payload,
                                                  HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        Doctor doctor = doctorRepository.findById(id).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();
        if (doctor.getUser() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Este médico já possui acesso."));
        }
        String email = normalize(payload.get("email"));
        String password = payload.get("password");
        if (email == null || password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe um e-mail e uma senha com ao menos 8 caracteres."));
        }
        email = email.toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "E-mail já cadastrado."));
        }
        User user = new User(doctor.getName(), email, passwordEncoder.encode(password));
        user.setRole(User.ROLE_DOCTOR);
        doctor.setUser(userRepository.save(user));
        doctorRepository.save(doctor);
        return ResponseEntity.ok(Map.of("message", "Acesso médico criado.", "email", email));
    }

    @GetMapping("/doctors/{id}/working-hours")
    public ResponseEntity<?> doctorWorkingHours(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!doctorRepository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(scheduleService.workingHours(id));
    }

    @PutMapping("/doctors/{id}/working-hours")
    public ResponseEntity<?> saveDoctorWorkingHours(@PathVariable Long id,
                                                     @RequestBody List<Map<String, String>> payload,
                                                     HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        Doctor doctor = doctorRepository.findById(id).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();
        try { return ResponseEntity.ok(scheduleService.replaceWorkingHours(doctor, payload)); }
        catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/doctors/{id}/blocks")
    public ResponseEntity<?> doctorBlocks(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!doctorRepository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(scheduleService.blocks(id));
    }

    @PostMapping("/doctors/{id}/blocks")
    public ResponseEntity<?> createDoctorBlock(@PathVariable Long id, @RequestBody Map<String, String> payload,
                                                HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        Doctor doctor = doctorRepository.findById(id).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();
        try {
            return ResponseEntity.ok(scheduleService.createBlock(doctor, LocalDate.parse(payload.get("startDate")),
                    LocalDate.parse(payload.get("endDate")), payload.get("reason")));
        } catch (DateTimeParseException | NullPointerException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe as datas inicial e final."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
        }
    }

    @DeleteMapping("/doctors/{doctorId}/blocks/{blockId}")
    public ResponseEntity<?> deleteDoctorBlock(@PathVariable Long doctorId, @PathVariable Long blockId,
                                                HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        if (!scheduleService.deleteOwnBlock(blockId, doctorId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("message", "Bloqueio removido."));
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> appointments(HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(statusService.refreshCompleted(appointmentRepository.findAllByOrderByCreatedAtDesc())
                .stream().map(AppointmentResponse::from).toList());
    }

    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        Long patientId = numberAsLong(payload.get("patientId"));
        Long doctorId = numberAsLong(payload.get("doctorId"));
        Doctor selectedDoctor = doctorId == null ? null : doctorRepository.findById(doctorId).orElse(null);
        String dateValue = normalize((String) payload.get("appointmentDate"));
        String timeValue = normalize((String) payload.get("appointmentTime"));
        if (patientId == null || doctorId == null || selectedDoctor == null || dateValue == null || timeValue == null) {
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
        if (!scheduleService.isAvailable(selectedDoctor, date, time)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Este horário não está disponível na agenda do médico."));
        }
        if (appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                selectedDoctor.getId(), displayDate, displayTime, "CANCELADO")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "O médico já possui uma consulta neste horário."));
        }
        Appointment appointment = new Appointment(patient.get(), selectedDoctor, displayDate, displayTime,
                normalize((String) payload.get("observation")));
        return ResponseEntity.ok(AppointmentResponse.from(appointmentRepository.save(appointment)));
    }

    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return forbidden();
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setStatus("CANCELADO");
            return ResponseEntity.ok((Object) AppointmentResponse.from(appointmentRepository.save(appointment)));
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

    private Map<String, String> hour(String day) {
        return Map.of("dayOfWeek", day, "startTime", "09:00", "endTime", "18:00");
    }
}
