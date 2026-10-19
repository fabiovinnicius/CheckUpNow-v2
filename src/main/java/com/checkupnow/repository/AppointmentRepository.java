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
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Long doctorId, String appointmentDate, String appointmentTime, String status);
    boolean existsByDoctorId(Long doctorId);
    void deleteByUserId(Long userId);
    List<Appointment> findByDoctorNameOrderByCreatedAtDesc(String doctorName);
    List<Appointment> findByDoctorNameAndStatusNot(String doctorName, String status);
    List<Appointment> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<Appointment> findByDoctorIdAndStatusNot(Long doctorId, String status);
}
