package com.dogmania.api.controller;

import com.dogmania.api.dto.AuthRequestDTO;
import com.dogmania.api.dto.AuthResponseDTO;
import com.dogmania.api.dto.CurrentUserDTO;
import org.springframework.web.bind.annotation.GetMapping;
import java.security.Principal;
import jakarta.servlet.http.HttpServletRequest;
import com.dogmania.api.security.LoginAttemptLimiter;
import com.dogmania.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticação", description = "Endpoints de autenticação para o painel administrativo")
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptLimiter limiter;

    public AuthController(AuthService authService, LoginAttemptLimiter limiter) {
        this.authService = authService;
        this.limiter = limiter;
    }

    @PostMapping("/login")
    @Operation(summary = "Login administrativo", description = "Autentica usuário e retorna JWT Bearer token")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request, HttpServletRequest httpRequest) {
        limiter.check(httpRequest.getRemoteAddr());
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public CurrentUserDTO me(Principal principal) {
        return authService.currentUser(principal.getName());
    }
}
