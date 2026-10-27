package com.checkupnow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    @JsonIgnoreProperties("user")
    private Doctor doctor;

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String specialty;

    @Column(nullable = false)
    private String appointmentDate;

    @Column(nullable = false)
    private String appointmentTime;

    @Column(nullable = false)
    private String status; // AGENDADO, CONCLUIDO, CANCELADO

    private String observation;
    private LocalDateTime createdAt;

    public Appointment() {
        this.createdAt = LocalDateTime.now();
        this.status = "AGENDADO";
    }

    public Appointment(User user, String doctorName, String specialty, String appointmentDate, String appointmentTime, String observation) {
        this();
        this.user = user;
        this.doctorName = doctorName;
        this.specialty = specialty;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.observation = observation;
    }

    public Appointment(User user, Doctor doctor, String appointmentDate, String appointmentTime, String observation) {
        this(user, doctor.getName(), doctor.getSpecialty(), appointmentDate, appointmentTime, observation);
        this.doctor = doctor;
    }

    public Appointment(User user, Doctor doctor, String specialty, String appointmentDate,
                       String appointmentTime, String observation) {
        this(user, doctor.getName(), specialty, appointmentDate, appointmentTime, observation);
        this.doctor = doctor;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
        if (doctor != null) {
            this.doctorName = doctor.getName();
            this.specialty = doctor.getSpecialty();
        }
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(String appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(String appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
