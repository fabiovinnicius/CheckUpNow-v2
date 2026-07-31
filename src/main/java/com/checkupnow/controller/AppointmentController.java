package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public AppointmentController(AppointmentRepository appointmentRepository, UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserAppointments(HttpSession session, @RequestParam(value = "userId", required = false) Long paramUserId) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            userId = paramUserId;
        }

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }

        List<Appointment> appointments = appointmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(appointments);
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null && payload.containsKey("userId")) {
            Object rawId = payload.get("userId");
            if (rawId instanceof Number) {
                userId = ((Number) rawId).longValue();
            } else if (rawId instanceof String) {
                try {
                    userId = Long.parseLong((String) rawId);
                } catch (NumberFormatException ignored) {}
            }
        }

        if (userId == null) {
            // Fallback to first user in system if available, or create temporary guest
            Optional<User> firstUser = userRepository.findAll().stream().findFirst();
            if (firstUser.isPresent()) {
                userId = firstUser.get().getId();
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não identificado para agendamento."));
            }
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Usuário não encontrado."));
        }

        String doctorName = (String) payload.get("doctorName");
        String specialty = (String) payload.get("specialty");
        String appointmentDate = (String) payload.get("appointmentDate");
        String appointmentTime = (String) payload.get("appointmentTime");
        String observation = (String) payload.getOrDefault("observation", "");

        if (doctorName == null || specialty == null || appointmentDate == null || appointmentTime == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Todos os campos do agendamento são obrigatórios."));
        }

        Appointment appointment = new Appointment(userOpt.get(), doctorName, specialty, appointmentDate, appointmentTime, observation);
        Appointment saved = appointmentRepository.save(appointment);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setStatus("CANCELADO");
            Appointment updated = appointmentRepository.save(appointment);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
