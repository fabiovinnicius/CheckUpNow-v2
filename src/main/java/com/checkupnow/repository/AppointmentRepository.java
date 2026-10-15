package com.checkupnow.repository;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserOrderByCreatedAtDesc(User user);
    List<Appointment> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Appointment> findAllByOrderByCreatedAtDesc();
    boolean existsByDoctorNameAndAppointmentDateAndAppointmentTimeAndStatusNot(
            String doctorName, String appointmentDate, String appointmentTime, String status);
    void deleteByUserId(Long userId);
}
