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
    public ResponseEntity<?> getUserAppointments(HttpSession session) {
        // O userId vem exclusivamente da sessão - nunca de um parâmetro da URL,
        // senão qualquer pessoa poderia ver a agenda de outro usuário.
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }

        List<Appointment> appointments = appointmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(appointments);
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, HttpSession session) {
        // O usuário do agendamento vem exclusivamente da sessão autenticada.
        // Nunca aceitar um "userId" vindo do corpo da requisição aqui, pois
        // isso permitiria que qualquer pessoa marcasse consulta em nome de outra.
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
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
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }

        Optional<Appointment> appointmentOpt = appointmentRepository.findById(id);
        if (appointmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Appointment appointment = appointmentOpt.get();

        // Só o dono da consulta pode cancelá-la.
        if (!appointment.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Você não tem permissão para cancelar esta consulta."));
        }

        appointment.setStatus("CANCELADO");
        Appointment updated = appointmentRepository.save(appointment);
        return ResponseEntity.ok(updated);
    }
}
