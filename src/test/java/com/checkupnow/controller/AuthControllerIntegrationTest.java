package com.checkupnow.controller;

import com.checkupnow.model.User;
import com.checkupnow.repository.AppointmentRepository;
import com.checkupnow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired AppointmentRepository appointmentRepository;

    @BeforeEach
    void cleanUsers() {
        appointmentRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registerHashesPasswordAndDoesNotExposeIt() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Maria Silva","email":"MARIA@example.com","password":"segredo123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("maria@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());

        User saved = userRepository.findByEmail("maria@example.com").orElseThrow();
        assertThat(saved.getPassword()).startsWith("$2").isNotEqualTo("segredo123");
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"João\",\"email\":\"joao@example.com\",\"password\":\"correta123\"}"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"joao@example.com\",\"password\":\"errada123\"}"))
                .andExpect(status().isUnauthorized());
    }
}
