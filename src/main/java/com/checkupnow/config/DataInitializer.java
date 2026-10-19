package com.checkupnow.config;

import com.checkupnow.model.Doctor;
import com.checkupnow.model.Specialty;
import com.checkupnow.model.User;
import com.checkupnow.model.DoctorWorkingHour;
import com.checkupnow.repository.DoctorRepository;
import com.checkupnow.repository.DoctorWorkingHourRepository;
import com.checkupnow.repository.SpecialtyRepository;
import com.checkupnow.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final UserRepository userRepository;
    private final DoctorWorkingHourRepository workingHourRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataInitializer(DoctorRepository doctorRepository, SpecialtyRepository specialtyRepository,
                           UserRepository userRepository, DoctorWorkingHourRepository workingHourRepository) {
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
        this.userRepository = userRepository;
        this.workingHourRepository = workingHourRepository;
    }

    @Override
    public void run(String... args) {
        doctorRepository.findByName("Dr. Raquel teste").forEach(doctor -> {
            doctor.setSpecialty("Dermatologia");
            doctorRepository.save(doctor);
        });
        doctorRepository.deleteAll(doctorRepository.findByName("Dra. Raquel teste"));

        Map<String, List<String>> doctorsDB = new LinkedHashMap<>();
        doctorsDB.put("Clínica Geral", Arrays.asList("Dr. Anderson teste", "Dra. Ana Mendes"));
        doctorsDB.put("Cardiologia", Arrays.asList("Dr. Roberto Costa", "Dr. Carlos Silva"));
        doctorsDB.put("Dermatologia", Arrays.asList("Dr. Raquel teste", "Dra. Marina Santos"));
        doctorsDB.put("Ginecologia", Arrays.asList("Dra. Camila Ribeiro", "Dra. Sofia Lima"));
        doctorsDB.put("Pediatria", Arrays.asList("Dra. Fernanda Gomes", "Dr. Lucas Martins"));
        doctorsDB.put("Ortopedia", Arrays.asList("Dr. Pedro Henrique", "Dr. André Santos"));
        doctorsDB.put("Psicologia", Arrays.asList("Dra. Júlia Nogueira", "Dr. Fernando Almeida"));
        doctorsDB.put("Nutrição", Arrays.asList("Dra. Beatriz Costa", "Dr. Gabriel Souza"));
        doctorsDB.put("Endocrinologia", Arrays.asList("Dr. Ricardo Alves", "Dra. Helena Martins"));
        doctorsDB.put("Neurologia", Arrays.asList("Dr. Antônio Carlos", "Dra. Letícia Ferreira"));
        doctorsDB.put("Oftalmologia", Arrays.asList("Dra. Lúcia Freitas", "Dr. Eduardo Ramos"));
        doctorsDB.put("Fisioterapia", Arrays.asList("Dra. Mariana Silva", "Dr. João Paulo"));

        doctorsDB.keySet().forEach(name -> {
            if (!specialtyRepository.existsByNameIgnoreCase(name)) {
                specialtyRepository.save(new Specialty(name));
            }
        });

        int crmCount = 2001;
        for (Map.Entry<String, List<String>> entry : doctorsDB.entrySet()) {
            String specialty = entry.getKey();
            for (String name : entry.getValue()) {
                if (!doctorRepository.existsByNameAndSpecialty(name, specialty)) {
                    Doctor doc = new Doctor(name, specialty, "CRM/SP " + (crmCount++));
                    doctorRepository.save(doc);
                }
            }
        }

        doctorRepository.findAll().forEach(doctor -> {
            if (workingHourRepository.findByDoctorIdOrderByDayOfWeekAsc(doctor.getId()).isEmpty()) {
                for (DayOfWeek day : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                        DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
                    workingHourRepository.save(new DoctorWorkingHour(
                            doctor, day, LocalTime.of(9, 0), LocalTime.of(18, 0)));
                }
            }
        });

        User doctorUser = userRepository.findByEmail("medico@checkupnow.com").orElseGet(() -> {
            User created = new User("Dr. Anderson teste", "medico@checkupnow.com",
                    passwordEncoder.encode("medico123"));
            created.setRole(User.ROLE_DOCTOR);
            return userRepository.save(created);
        });
        doctorUser.setRole(User.ROLE_DOCTOR);
        if (!passwordEncoder.matches("medico123", doctorUser.getPassword())) {
            doctorUser.setPassword(passwordEncoder.encode("medico123"));
        }
        userRepository.save(doctorUser);
        if (doctorRepository.findByUserId(doctorUser.getId()).isEmpty()) {
            doctorRepository.findByName("Dr. Anderson teste").stream()
                    .filter(doctor -> doctor.getUser() == null)
                    .findFirst()
                    .ifPresent(doctor -> {
                        doctor.setUser(doctorUser);
                        doctorRepository.save(doctor);
                    });
        }

        userRepository.findAll().stream()
                .filter(user -> User.ROLE_CLIENT.equals(user.getRole()))
                .forEach(user -> {
                    user.setRole(User.ROLE_CLIENT);
                    userRepository.save(user);
                });

        userRepository.findByEmail("admin@checkupnow.com").ifPresentOrElse(admin -> {
            if (!User.ROLE_ADMIN.equals(admin.getRole())) {
                admin.setRole(User.ROLE_ADMIN);
                userRepository.save(admin);
            }
        }, () -> {
            User admin = new User("Administrador CheckUp Now", "admin@checkupnow.com",
                    passwordEncoder.encode("admin123"));
            admin.setRole(User.ROLE_ADMIN);
            userRepository.save(admin);
        });
    }
}
