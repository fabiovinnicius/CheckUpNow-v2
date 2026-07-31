package com.checkupnow.controller;

import com.checkupnow.model.User;
import com.checkupnow.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User updatedUser) {
        return userRepository.findById(id).map(user -> {
            if (updatedUser.getName() != null) user.setName(updatedUser.getName());
            if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
            if (updatedUser.getBirthDate() != null) user.setBirthDate(updatedUser.getBirthDate());
            if (updatedUser.getCep() != null) user.setCep(updatedUser.getCep());
            if (updatedUser.getCpf() != null) user.setCpf(updatedUser.getCpf());
            if (updatedUser.getPhone() != null) user.setPhone(updatedUser.getPhone());
            if (updatedUser.getGender() != null) user.setGender(updatedUser.getGender());
            if (updatedUser.getHealthPlan() != null) user.setHealthPlan(updatedUser.getHealthPlan());
            if (updatedUser.getHasChronicDisease() != null) user.setHasChronicDisease(updatedUser.getHasChronicDisease());
            if (updatedUser.getTakesContinuousMedication() != null) user.setTakesContinuousMedication(updatedUser.getTakesContinuousMedication());
            if (updatedUser.getAvatarUrl() != null) user.setAvatarUrl(updatedUser.getAvatarUrl());

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/additional-info")
    public ResponseEntity<?> updateAdditionalInfo(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return userRepository.findById(id).map(user -> {
            if (payload.containsKey("birthDate")) user.setBirthDate((String) payload.get("birthDate"));
            if (payload.containsKey("cep")) user.setCep((String) payload.get("cep"));
            if (payload.containsKey("cpf")) user.setCpf((String) payload.get("cpf"));
            if (payload.containsKey("phone")) user.setPhone((String) payload.get("phone"));
            if (payload.containsKey("gender")) user.setGender((String) payload.get("gender"));
            if (payload.containsKey("healthPlan")) user.setHealthPlan((String) payload.get("healthPlan"));
            if (payload.containsKey("hasChronicDisease")) user.setHasChronicDisease((Boolean) payload.get("hasChronicDisease"));
            if (payload.containsKey("takesContinuousMedication")) user.setTakesContinuousMedication((Boolean) payload.get("takesContinuousMedication"));
            if (payload.containsKey("avatarUrl")) user.setAvatarUrl((String) payload.get("avatarUrl"));

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
