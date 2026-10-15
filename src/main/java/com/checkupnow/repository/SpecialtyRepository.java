package com.checkupnow.repository;

import com.checkupnow.model.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    List<Specialty> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
