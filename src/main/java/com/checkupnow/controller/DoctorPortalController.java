package com.checkupnow.controller;

import com.checkupnow.model.*;
import com.checkupnow.dto.AppointmentResponse;
import com.checkupnow.repository.*;
import com.checkupnow.service.DoctorScheduleService;
import com.checkupnow.service.AppointmentStatusService;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/doctor")
public class DoctorPortalController {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleService scheduleService;
    private final AppointmentStatusService statusService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DoctorPortalController(UserRepository userRepository, DoctorRepository doctorRepository,
                                  AppointmentRepository appointmentRepository,
                                  DoctorScheduleService scheduleService, AppointmentStatusService statusService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.scheduleService = scheduleService;
        this.statusService = statusService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String email = normalizeEmail(payload.get("email"));
        String password = payload.get("password");
        Optional<User> user = email == null ? Optional.empty() : userRepository.findByEmail(email);
        if (user.isPresent() && User.ROLE_DOCTOR.equals(user.get().getRole())
                && password != null && passwordEncoder.matches(password, user.get().getPassword())
                && doctorRepository.findByUserId(user.get().getId()).isPresent()) {
            HttpSession session = request.getSession(true);
            request.changeSessionId();
            session.setAttribute("userId", user.get().getId());
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "E-mail ou senha de médico inválidos."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        return ResponseEntity.ok(Map.of(
                "id", doctor.get().getId(), "name", doctor.get().getName(), "specialty", doctor.get().getSpecialty(),
                "specialties", doctor.get().getSpecialties(),
                "crm", doctor.get().getCrm() == null ? "" : doctor.get().getCrm(),
                "email", doctor.get().getUser().getEmail()
        ));
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> appointments(HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        return ResponseEntity.ok(statusService.refreshCompleted(
                appointmentRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.get().getId())).stream()
                .map(AppointmentResponse::from).toList());
    }

    @GetMapping("/working-hours")
    public ResponseEntity<?> workingHours(HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        return ResponseEntity.ok(scheduleService.workingHours(doctor.get().getId()));
    }

    @PutMapping("/working-hours")
    public ResponseEntity<?> saveWorkingHours(@RequestBody List<Map<String, String>> payload, HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        try { return ResponseEntity.ok(scheduleService.replaceWorkingHours(doctor.get(), payload)); }
        catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping("/blocks")
    public ResponseEntity<?> blocks(HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        return ResponseEntity.ok(scheduleService.blocks(doctor.get().getId()));
    }

    @PostMapping("/blocks")
    public ResponseEntity<?> createBlock(@RequestBody Map<String, String> payload, HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        try {
            return ResponseEntity.ok(scheduleService.createBlock(doctor.get(),
                    LocalDate.parse(payload.get("startDate")), LocalDate.parse(payload.get("endDate")),
                    payload.get("reason")));
        } catch (DateTimeParseException | NullPointerException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe as datas inicial e final."));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", exception.getMessage()));
        }
    }

    @DeleteMapping("/blocks/{id}")
    public ResponseEntity<?> deleteBlock(@PathVariable Long id, HttpSession session) {
        Optional<Doctor> doctor = currentDoctor(session);
        if (doctor.isEmpty()) return forbidden();
        if (!scheduleService.deleteOwnBlock(id, doctor.get().getId())) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("message", "Bloqueio removido."));
    }

    private Optional<Doctor> currentDoctor(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return Optional.empty();
        return userRepository.findById(userId).filter(user -> User.ROLE_DOCTOR.equals(user.getRole()))
                .flatMap(user -> doctorRepository.findByUserId(user.getId()));
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acesso restrito a médicos."));
    }

    private String normalizeEmail(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
