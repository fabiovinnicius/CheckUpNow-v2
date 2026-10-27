package com.checkupnow.model;

import jakarta.persistence.*;
import java.util.Collection;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String specialty;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "doctor_specialties", joinColumns = @JoinColumn(name = "doctor_id"))
    @Column(name = "specialty", nullable = false)
    @OrderColumn(name = "display_order")
    private List<String> specialties = new ArrayList<>();

    private String crm;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    public Doctor() {
    }

    public Doctor(String name, String specialty, String crm) {
        this.name = name;
        setSpecialties(Set.of(specialty));
        this.crm = crm;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        setSpecialties(Set.of(specialty));
    }

    public List<String> getSpecialties() {
        if (specialties == null || specialties.isEmpty()) {
            return specialty == null ? List.of() : List.of(specialty);
        }
        return new ArrayList<>(specialties);
    }

    public void setSpecialties(Collection<String> values) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (values != null) {
            values.stream().filter(value -> value != null && !value.isBlank())
                    .map(String::trim).forEach(normalized::add);
        }
        if (normalized.isEmpty()) throw new IllegalArgumentException("Informe ao menos uma especialidade.");
        this.specialties = new ArrayList<>(normalized);
        this.specialty = normalized.iterator().next();
    }

    public String getCrm() {
        return crm;
    }

    public void setCrm(String crm) {
        this.crm = crm;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
