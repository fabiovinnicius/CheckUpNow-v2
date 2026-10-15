package com.checkupnow.repository;

import com.checkupnow.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findBySpecialty(String specialty);

    List<Doctor> findByName(String name);

    boolean existsByNameAndSpecialty(String name, String specialty);
}
