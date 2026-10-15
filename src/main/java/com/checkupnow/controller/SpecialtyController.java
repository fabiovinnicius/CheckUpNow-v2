package com.checkupnow.controller;

import com.checkupnow.model.Specialty;
import com.checkupnow.repository.SpecialtyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
public class SpecialtyController {

    private final SpecialtyRepository specialtyRepository;

    public SpecialtyController(SpecialtyRepository specialtyRepository) {
        this.specialtyRepository = specialtyRepository;
    }

    @GetMapping
    public ResponseEntity<List<Specialty>> list() {
        return ResponseEntity.ok(specialtyRepository.findAllByOrderByNameAsc());
    }
}
