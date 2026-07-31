package com.checkupnow.config;

import com.checkupnow.model.Doctor;
import com.checkupnow.repository.DoctorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;

    public DataInitializer(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    public void run(String... args) {
        if (doctorRepository.count() == 0) {
            Map<String, List<String>> doctorsDB = new HashMap<>();
            doctorsDB.put("Consultas Clínicas Gerais", Arrays.asList("Dr. Carlos Silva", "Dra. Ana Mendes", "Dr. Roberto Costa"));
            doctorsDB.put("Psicologia e Psquiatria", Arrays.asList("Dra. Júlia Nogueira", "Dr. Fernando Almeida"));
            doctorsDB.put("Especialidades Médicas", Arrays.asList("Dr. Pedro Henrique", "Dra. Marina Santos", "Dra. Sofia Lima"));
            doctorsDB.put("Genética Médica", Arrays.asList("Dr. Ricardo Alves", "Dra. Beatriz Costa"));
            doctorsDB.put("Consultas Cirúrgicas", Arrays.asList("Dra. Camila Ribeiro", "Dr. João Paulo"));
            doctorsDB.put("Geriatria", Arrays.asList("Dr. Antônio Carlos", "Dra. Lúcia Freitas"));
            doctorsDB.put("Pediatria", Arrays.asList("Dra. Fernanda Gomes", "Dr. Lucas Martins"));
            doctorsDB.put("Outras especialidades", Arrays.asList("Dra. Mariana Silva", "Dr. André Santos"));

            int crmCount = 1001;
            for (Map.Entry<String, List<String>> entry : doctorsDB.entrySet()) {
                String specialty = entry.getKey();
                for (String name : entry.getValue()) {
                    Doctor doc = new Doctor(name, specialty, "CRM/SP " + (crmCount++));
                    doctorRepository.save(doc);
                }
            }
        }
    }
}
