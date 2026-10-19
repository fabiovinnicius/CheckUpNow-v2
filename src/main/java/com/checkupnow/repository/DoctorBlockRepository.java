package com.checkupnow.repository;

import com.checkupnow.model.DoctorBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DoctorBlockRepository extends JpaRepository<DoctorBlock, Long> {
    List<DoctorBlock> findByDoctorIdOrderByStartDateAsc(Long doctorId);
    boolean existsByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long doctorId, LocalDate dateAtEnd, LocalDate dateAtStart);
    void deleteByDoctorId(Long doctorId);
}
