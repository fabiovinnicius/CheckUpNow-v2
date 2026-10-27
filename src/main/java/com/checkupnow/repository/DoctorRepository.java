package com.checkupnow.repository;

import com.checkupnow.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    @Query("select distinct d from Doctor d join d.specialties specialty where lower(specialty) = lower(:specialty) order by d.name")
    List<Doctor> findBySpecialty(@Param("specialty") String specialty);

    List<Doctor> findByName(String name);

    boolean existsByNameIgnoreCase(String name);
    @Query("select (count(d) > 0) from Doctor d join d.specialties specialty where lower(specialty) = lower(:specialty)")
    boolean existsBySpecialty(@Param("specialty") String specialty);
    Optional<Doctor> findByUserId(Long userId);
}
