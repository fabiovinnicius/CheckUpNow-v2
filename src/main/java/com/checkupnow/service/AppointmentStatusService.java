package com.checkupnow.service;

import com.checkupnow.model.Appointment;
import com.checkupnow.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import java.time.*;
import java.time.format.*;
import java.util.List;

@Service
public class AppointmentStatusService {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private final AppointmentRepository appointmentRepository;

    public AppointmentStatusService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public List<Appointment> refreshCompleted(List<Appointment> appointments) {
        boolean changed = false;
        LocalDateTime now = LocalDateTime.now(ZoneId.of("America/Sao_Paulo"));
        for (Appointment appointment : appointments) {
            if (!"AGENDADO".equals(appointment.getStatus())) continue;
            try {
                LocalDateTime dateTime = LocalDateTime.parse(
                        appointment.getAppointmentDate() + " " + appointment.getAppointmentTime(), DATE_TIME);
                if (dateTime.isBefore(now)) {
                    appointment.setStatus("CONCLUIDO");
                    changed = true;
                }
            } catch (DateTimeParseException ignored) {}
        }
        return changed ? appointmentRepository.saveAll(appointments) : appointments;
    }
}
