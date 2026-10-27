package com.checkupnow.controller;

import com.checkupnow.model.Doctor;
import com.checkupnow.repository.DoctorRepository;
import com.checkupnow.service.DoctorScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleService scheduleService;

    public DoctorController(DoctorRepository doctorRepository, DoctorScheduleService scheduleService) {
        this.doctorRepository = doctorRepository;
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll().stream().map(this::publicDoctor).toList());
    }

    @GetMapping("/specialty")
    public ResponseEntity<List<Map<String, Object>>> getDoctorsBySpecialty(@RequestParam("name") String specialty) {
        return ResponseEntity.ok(doctorRepository.findBySpecialty(specialty).stream().map(this::publicDoctor).toList());
    }

    @GetMapping("/{id}/available-times")
    public ResponseEntity<?> availableTimes(@PathVariable Long id, @RequestParam String date) {
        try {
            return doctorRepository.findById(id)
                    .map(doctor -> ResponseEntity.ok((Object) scheduleService.availableTimes(doctor, java.time.LocalDate.parse(date))))
                    .orElse(ResponseEntity.notFound().build());
        } catch (java.time.format.DateTimeParseException exception) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Data inválida."));
        }
    }

    private Map<String, Object> publicDoctor(Doctor doctor) {
        return Map.of("id", doctor.getId(), "name", doctor.getName(), "specialty", doctor.getSpecialty(),
                "specialties", doctor.getSpecialties(), "crm", doctor.getCrm() == null ? "" : doctor.getCrm());
    }
}
