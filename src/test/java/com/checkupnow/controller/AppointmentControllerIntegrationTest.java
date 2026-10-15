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

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

    @Test
    void authenticatedUserCanCreateFutureAppointmentWithinOneYear() throws Exception {
        User user = userRepository.save(new User("Paciente", "patient@example.com", "hash"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", user.getId());
        String futureDate = LocalDate.now().plusDays(1).toString();

        mockMvc.perform(post("/api/appointments")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appointmentJson(futureDate, "10:00")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentDate").value(
                        LocalDate.parse(futureDate).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
    }

    @Test
    void authenticatedUserCannotCreatePastAppointment() throws Exception {
        User user = userRepository.save(new User("Paciente", "past@example.com", "hash"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", user.getId());

        mockMvc.perform(post("/api/appointments")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appointmentJson(LocalDate.now().minusDays(1).toString(), "10:00")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void authenticatedUserCannotCreateAppointmentBeyondOneYear() throws Exception {
        User user = userRepository.save(new User("Paciente", "future@example.com", "hash"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", user.getId());

        mockMvc.perform(post("/api/appointments")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appointmentJson(LocalDate.now().plusYears(1).plusDays(1).toString(), "10:00")))
                .andExpect(status().isBadRequest());
    }

    private String appointmentJson() {
        return """
                {"doctorName":"Dra. Ana","specialty":"Clínica Geral","appointmentDate":"20/09/2026","appointmentTime":"10:00"}
                """;
    }

    private String appointmentJson(String date, String time) {
        return String.format(
                "{\"doctorName\":\"Dra. Ana\",\"specialty\":\"Clínica Geral\",\"appointmentDate\":\"%s\",\"appointmentTime\":\"%s\"}",
                date,
                time
        );
    }
}
