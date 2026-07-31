package com.checkupnow.controller;

import com.checkupnow.model.Doctor;
import com.checkupnow.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorRepository doctorRepository;

    public DoctorController(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/specialty")
    public ResponseEntity<List<Doctor>> getDoctorsBySpecialty(@RequestParam("name") String specialty) {
        return ResponseEntity.ok(doctorRepository.findBySpecialty(specialty));
    }
}
