package com.checkupnow.config;

import com.checkupnow.model.Doctor;
import com.checkupnow.model.Specialty;
import com.checkupnow.model.User;
import com.checkupnow.repository.DoctorRepository;
import com.checkupnow.repository.SpecialtyRepository;
import com.checkupnow.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataInitializer(DoctorRepository doctorRepository, SpecialtyRepository specialtyRepository,
                           UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
        this.userRepository = userRepository;
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
