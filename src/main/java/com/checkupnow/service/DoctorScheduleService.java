package com.checkupnow.service;

import com.checkupnow.model.*;
import com.checkupnow.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class DoctorScheduleService {
    public static final String BLOCK_CONFLICT_MESSAGE =
            "Existem consultas marcadas para esse período, fale com a admistração";
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("HH:mm");

    private final DoctorWorkingHourRepository workingHourRepository;
    private final DoctorBlockRepository blockRepository;
    private final AppointmentRepository appointmentRepository;

    public DoctorScheduleService(DoctorWorkingHourRepository workingHourRepository,
                                 DoctorBlockRepository blockRepository,
                                 AppointmentRepository appointmentRepository) {
        this.workingHourRepository = workingHourRepository;
        this.blockRepository = blockRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public List<DoctorWorkingHour> workingHours(Long doctorId) {
        return workingHourRepository.findByDoctorIdOrderByDayOfWeekAsc(doctorId);
    }

    @Transactional
    public List<DoctorWorkingHour> replaceWorkingHours(Doctor doctor, List<Map<String, String>> rows) {
        List<DoctorWorkingHour> parsed = new ArrayList<>();
        Set<DayOfWeek> days = new HashSet<>();
        for (Map<String, String> row : rows) {
            DayOfWeek day = DayOfWeek.valueOf(required(row.get("dayOfWeek")).toUpperCase(Locale.ROOT));
            LocalTime start = LocalTime.parse(required(row.get("startTime")));
            LocalTime end = LocalTime.parse(required(row.get("endTime")));
            if (!start.isBefore(end) || !days.add(day)) {
                throw new IllegalArgumentException("Cada dia deve ter um único intervalo com início anterior ao fim.");
            }
            parsed.add(new DoctorWorkingHour(doctor, day, start, end));
        }
        workingHourRepository.deleteByDoctorId(doctor.getId());
        workingHourRepository.flush();
        return workingHourRepository.saveAll(parsed);
    }

    public List<DoctorBlock> blocks(Long doctorId) {
        return blockRepository.findByDoctorIdOrderByStartDateAsc(doctorId);
    }

    public DoctorBlock createBlock(Doctor doctor, LocalDate start, LocalDate end, String reason) {
        if (start == null || end == null || end.isBefore(start)) {
            throw new IllegalArgumentException("Informe um período de bloqueio válido.");
        }
        if (hasAppointmentsInPeriod(doctor, start, end)) {
            throw new IllegalStateException(BLOCK_CONFLICT_MESSAGE);
        }
        String safeReason = reason == null || reason.isBlank() ? "Compromisso pessoal" : reason.trim();
        return blockRepository.save(new DoctorBlock(doctor, start, end, safeReason));
    }

    public boolean deleteOwnBlock(Long blockId, Long doctorId) {
        return blockRepository.findById(blockId).filter(block -> block.getDoctor().getId().equals(doctorId))
                .map(block -> { blockRepository.delete(block); return true; }).orElse(false);
    }

    public List<String> availableTimes(Doctor doctor, LocalDate date) {
        Optional<DoctorWorkingHour> hours = workingHourRepository.findByDoctorIdAndDayOfWeek(
                doctor.getId(), date.getDayOfWeek());
        if (hours.isEmpty() || isBlocked(doctor.getId(), date)) return List.of();

        Set<String> occupied = new HashSet<>();
        String displayDate = date.format(DISPLAY_DATE);
        appointmentRepository.findByDoctorIdAndStatusNot(doctor.getId(), "CANCELADO").stream()
                .filter(item -> displayDate.equals(item.getAppointmentDate()))
                .forEach(item -> occupied.add(item.getAppointmentTime()));

        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
        ZonedDateTime limit = now.plusYears(1);
        List<String> times = new ArrayList<>();
        for (LocalTime time = hours.get().getStartTime(); time.isBefore(hours.get().getEndTime()); time = time.plusHours(1)) {
            ZonedDateTime slot = ZonedDateTime.of(date, time, now.getZone());
            String display = time.format(DISPLAY_TIME);
            if (slot.isAfter(now) && !slot.isAfter(limit) && !occupied.contains(display)) times.add(display);
        }
        return times;
    }

    public boolean isAvailable(Doctor doctor, LocalDate date, LocalTime time) {
        return availableTimes(doctor, date).contains(time.format(DISPLAY_TIME));
    }

    private boolean isBlocked(Long doctorId, LocalDate date) {
        return blockRepository.existsByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                doctorId, date, date);
    }

    private boolean hasAppointmentsInPeriod(Doctor doctor, LocalDate start, LocalDate end) {
        return appointmentRepository.findByDoctorIdAndStatusNot(doctor.getId(), "CANCELADO").stream()
                .map(item -> parseDate(item.getAppointmentDate()))
                .filter(Objects::nonNull)
                .anyMatch(date -> !date.isBefore(start) && !date.isAfter(end));
    }

    private LocalDate parseDate(String value) {
        try { return LocalDate.parse(value, DISPLAY_DATE); }
        catch (DateTimeParseException ignored) { return null; }
    }

    private String required(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Horário de trabalho incompleto.");
        return value.trim();
    }
}
