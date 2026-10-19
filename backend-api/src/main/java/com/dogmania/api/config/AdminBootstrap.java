package com.dogmania.api.config;

import com.dogmania.api.model.AdminUser;
import com.dogmania.api.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "dogmania.bootstrap.admin.enabled", havingValue = "true")
public class AdminBootstrap implements ApplicationRunner {
    private final AdminUserRepository users;
    private final PasswordEncoder encoder;
    @Value("${dogmania.bootstrap.admin.email}") private String email;
    @Value("${dogmania.bootstrap.admin.password}") private String password;

    @Override
    public void run(ApplicationArguments args) {
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || normalized.length() > 255
                || password.length() < 16 || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Bootstrap exige e-mail válido e senha de 16 caracteres a 72 bytes");
        }
        if (users.findByEmailIgnoreCase(normalized).isPresent()) return;
        users.save(AdminUser.builder().name("Administrador").email(normalized)
                .passwordHash(encoder.encode(password)).role(AdminUser.Role.ADMIN).active(true).build());
    }
}
