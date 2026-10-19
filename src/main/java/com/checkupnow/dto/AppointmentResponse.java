package com.checkupnow.dto;

import com.checkupnow.model.Appointment;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

public record AppointmentResponse(
        Long id,
        Map<String, Object> user,
        Map<String, Object> doctor,
        String doctorName,
        String specialty,
        String appointmentDate,
        String appointmentTime,
        String status,
        String observation,
        LocalDateTime createdAt
) {
    public static AppointmentResponse from(Appointment appointment) {
        Map<String, Object> patient = Map.of(
                "id", appointment.getUser().getId(),
                "name", appointment.getUser().getName());
        Map<String, Object> doctor = null;
        if (appointment.getDoctor() != null) {
            doctor = new LinkedHashMap<>();
            doctor.put("id", appointment.getDoctor().getId());
            doctor.put("name", appointment.getDoctor().getName());
            doctor.put("specialty", appointment.getDoctor().getSpecialty());
            doctor.put("crm", appointment.getDoctor().getCrm());
        }
        return new AppointmentResponse(appointment.getId(), patient, doctor, appointment.getDoctorName(),
                appointment.getSpecialty(), appointment.getAppointmentDate(), appointment.getAppointmentTime(),
                appointment.getStatus(), appointment.getObservation(), appointment.getCreatedAt());
    }
}
