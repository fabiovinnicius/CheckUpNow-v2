package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private static final ZoneId APPOINTMENT_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter WINDOW_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public AppointmentController(AppointmentRepository appointmentRepository, UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/window")
    public ResponseEntity<Map<String, String>> getBookingWindow() {
        ZonedDateTime now = ZonedDateTime.now(APPOINTMENT_ZONE);
        ZonedDateTime start = now.plusMinutes(1).truncatedTo(ChronoUnit.MINUTES);
        ZonedDateTime end = now.plusYears(1).truncatedTo(ChronoUnit.MINUTES);

        return ResponseEntity.ok(Map.of(
                "timeZone", APPOINTMENT_ZONE.getId(),
                "startDateTime", start.format(WINDOW_DATE_TIME_FORMAT),
                "endDateTime", end.format(WINDOW_DATE_TIME_FORMAT)
        ));
    }

    @GetMapping
    public ResponseEntity<?> getUserAppointments(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }

        List<Appointment> appointments = appointmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(appointments);
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }

        var userOpt = userRepository.findById(userId);
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

        LocalDate parsedDate;
        LocalTime parsedTime;
        try {
            parsedDate = parseAppointmentDate(appointmentDate);
            parsedTime = LocalTime.parse(appointmentTime, DateTimeFormatter.ISO_LOCAL_TIME);
        } catch (DateTimeParseException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Data ou horário inválido."));
        }

        ZonedDateTime now = ZonedDateTime.now(APPOINTMENT_ZONE);
        ZonedDateTime requestedDateTime = ZonedDateTime.of(parsedDate, parsedTime, APPOINTMENT_ZONE);
        if (!requestedDateTime.isAfter(now)) {
            return ResponseEntity.badRequest().body(Map.of("message", "A consulta deve ser marcada para uma data e horário futuros."));
        }
        if (requestedDateTime.isAfter(now.plusYears(1))) {
            return ResponseEntity.badRequest().body(Map.of("message", "A consulta deve ser marcada dentro do período máximo de um ano."));
        }

        String displayDate = parsedDate.format(DISPLAY_DATE_FORMAT);
        String displayTime = parsedTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        if (appointmentRepository.existsByDoctorNameAndAppointmentDateAndAppointmentTimeAndStatusNot(
                doctorName, displayDate, displayTime, "CANCELADO")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Este médico já possui uma consulta neste horário."));
        }

        Appointment appointment = new Appointment(
                userOpt.get(),
                doctorName,
                specialty,
                displayDate,
                displayTime,
                observation
        );
        Appointment saved = appointmentRepository.save(appointment);

        return ResponseEntity.ok(saved);
    }

    private LocalDate parseAppointmentDate(String value) {
        try {
            return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ignored) {
            return LocalDate.parse(value, DISPLAY_DATE_FORMAT);
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuário não autenticado."));
        }
        return appointmentRepository.findById(id).map(appointment -> {
            if (!appointment.getUser().getId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) Map.of("message", "Consulta não pertence ao usuário autenticado."));
            }
            appointment.setStatus("CANCELADO");
            Appointment updated = appointmentRepository.save(appointment);
            return ResponseEntity.ok((Object) updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
