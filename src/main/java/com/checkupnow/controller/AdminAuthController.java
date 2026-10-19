package com.checkupnow.controller;

import com.checkupnow.model.User;
import com.checkupnow.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminAuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String email = payload.get("email") == null ? "" : payload.get("email").trim().toLowerCase();
        String password = payload.get("password");
        var admin = userRepository.findByEmail(email);
        if (admin.isEmpty() || !User.ROLE_ADMIN.equals(admin.get().getRole())
                || password == null || !passwordEncoder.matches(password, admin.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Credenciais administrativas inválidas."));
        }
        HttpSession session = request.getSession(true);
        request.changeSessionId();
        session.setAttribute("userId", admin.get().getId());
        return ResponseEntity.ok(admin.get());
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return unauthorized();
        return userRepository.findById(userId)
                .filter(user -> User.ROLE_ADMIN.equals(user.getRole()))
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(this::unauthorized);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Acesso restrito a administradores."));
    }
}
