package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.SpecialtyRepository;
import com.checkupnow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired AppointmentRepository appointmentRepository;
    @Autowired SpecialtyRepository specialtyRepository;

    @BeforeEach
    void cleanDatabase() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();
        specialtyRepository.deleteAll();
    }

    @Test
    void clientCannotAccessAdminResources() throws Exception {
        User client = userRepository.save(new User("Cliente", "client@test.com", "hash"));
        MockHttpSession session = sessionFor(client);
        mockMvc.perform(get("/api/admin/summary").session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanLoginAndManageSpecialties() throws Exception {
        createAdmin("admin@test.com", "admin123");
        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/admin/auth/login").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@test.com\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(post("/api/admin/specialties").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Reumatologia\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Reumatologia"));
    }

    @Test
    void adminCanBookAndCancelForClient() throws Exception {
        User admin = createAdmin("manager@test.com", "admin123");
        User client = userRepository.save(new User("Paciente", "patient@test.com", "hash"));
        MockHttpSession session = sessionFor(admin);
        String date = LocalDate.now().plusDays(2).toString();

        String response = mockMvc.perform(post("/api/admin/appointments").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"patientId\":%d,\"doctorName\":\"Dra. Ana\",\"specialty\":\"Clínica Geral\",\"appointmentDate\":\"%s\",\"appointmentTime\":\"10:00\"}", client.getId(), date)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AGENDADO"))
                .andReturn().getResponse().getContentAsString();

        Long appointmentId = appointmentRepository.findAll().getFirst().getId();
        mockMvc.perform(put("/api/admin/appointments/{id}/cancel", appointmentId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"));
    }

    @Test
    void deletingClientAlsoDeletesAppointments() throws Exception {
        User admin = createAdmin("owner@test.com", "admin123");
        User client = userRepository.save(new User("Paciente", "remove@test.com", "hash"));
        appointmentRepository.save(new Appointment(client, "Dra. Ana", "Clínica Geral", "20/12/2026", "10:00", ""));

        mockMvc.perform(delete("/api/admin/users/{id}", client.getId()).session(sessionFor(admin)))
                .andExpect(status().isOk());
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(client.getId())).isEmpty();
        org.assertj.core.api.Assertions.assertThat(appointmentRepository.findAll()).isEmpty();
    }

    private User createAdmin(String email, String password) {
        User admin = new User("Administrador", email, new BCryptPasswordEncoder().encode(password));
        admin.setRole(User.ROLE_ADMIN);
        return userRepository.save(admin);
    }

    private MockHttpSession sessionFor(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", user.getId());
        return session;
    }
}
