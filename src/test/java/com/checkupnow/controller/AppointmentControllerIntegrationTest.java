package com.checkupnow.controller;

import com.checkupnow.model.Appointment;
import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AppointmentControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired AppointmentRepository appointmentRepository;

    @BeforeEach
    void cleanDatabase() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void creatingAppointmentRequiresAuthenticatedSession() throws Exception {
        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appointmentJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userCannotCancelAnotherUsersAppointment() throws Exception {
        User owner = userRepository.save(new User("Dono", "owner@example.com", "hash"));
        User intruder = userRepository.save(new User("Outro", "other@example.com", "hash"));
        Appointment appointment = appointmentRepository.save(
                new Appointment(owner, "Dra. Ana", "Clínica Geral", "20/09/2026", "10:00", ""));

        MockHttpSession intruderSession = new MockHttpSession();
        intruderSession.setAttribute("userId", intruder.getId());

        mockMvc.perform(put("/api/appointments/{id}/cancel", appointment.getId())
                        .session(intruderSession))
                .andExpect(status().isForbidden());
    }

    private String appointmentJson() {
        return """
                {"doctorName":"Dra. Ana","specialty":"Clínica Geral","appointmentDate":"20/09/2026","appointmentTime":"10:00"}
                """;
    }
}
