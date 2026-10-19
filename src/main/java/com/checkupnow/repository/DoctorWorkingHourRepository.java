package com.checkupnow.repository;

import com.checkupnow.model.DoctorWorkingHour;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface DoctorWorkingHourRepository extends JpaRepository<DoctorWorkingHour, Long> {
    List<DoctorWorkingHour> findByDoctorIdOrderByDayOfWeekAsc(Long doctorId);
    Optional<DoctorWorkingHour> findByDoctorIdAndDayOfWeek(Long doctorId, DayOfWeek dayOfWeek);
    void deleteByDoctorId(Long doctorId);
}
