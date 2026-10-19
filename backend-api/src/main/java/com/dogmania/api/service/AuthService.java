package com.dogmania.api.service;

import com.dogmania.api.dto.AuthRequestDTO;
import com.dogmania.api.dto.AuthResponseDTO;
import com.dogmania.api.dto.CurrentUserDTO;
import com.dogmania.api.exception.UnauthorizedException;
import com.dogmania.api.model.AdminUser;
import com.dogmania.api.repository.AdminUserRepository;
import com.dogmania.api.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import java.util.Locale;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AdminUserRepository adminUserRepository;
    private final AuditService auditService;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       AdminUserRepository adminUserRepository,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.adminUserRepository = adminUserRepository;
        this.auditService = auditService;
    }

    public AuthResponseDTO login(AuthRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(Locale.ROOT), request.getPassword())
            );

            String token = tokenProvider.generateToken(authentication);
            AdminUser user = adminUserRepository.findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new UnauthorizedException("Usuário não encontrado"));

            auditService.logAction("LOGIN_SUCCESS", "AdminUser", user.getId(), user.getEmail(), "Login efetuado com sucesso");

            return AuthResponseDTO.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getExpirationTimeMs() / 1000)
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
        } catch (AuthenticationException e) {
            auditService.logAction("LOGIN_FAILED", "AdminUser", null, request.getEmail(), "Tentativa falha de autenticação");
            throw new UnauthorizedException("Credenciais inválidas");
        }
    }

    public CurrentUserDTO currentUser(String email) {
        AdminUser user = adminUserRepository.findByEmailIgnoreCase(email)
                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                .orElseThrow(() -> new UnauthorizedException("Sessão inválida"));
        return new CurrentUserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}
