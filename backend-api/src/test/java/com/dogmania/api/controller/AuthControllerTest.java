package com.dogmania.api.controller;

import com.dogmania.api.config.SecurityConfig;
import com.dogmania.api.model.AdminUser;
import com.dogmania.api.repository.AdminUserRepository;
import com.dogmania.api.security.*;
import com.dogmania.api.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers=AuthController.class,properties={
    "dogmania.security.jwt.secret-key=test-only-secret-key-at-least-32-bytes-long",
    "dogmania.security.jwt.expiration-ms=3600000","dogmania.cors.allowed-origins=http://localhost:8081"})
@Import({SecurityConfig.class,JwtAuthenticationFilter.class,JwtTokenProvider.class,CustomUserDetailsService.class,
    AuthService.class,LoginAttemptLimiter.class})
class AuthControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired PasswordEncoder encoder;
    @MockitoBean AdminUserRepository users;
    @MockitoBean AuditService audit;
    AdminUser user(boolean active) {
        AdminUser user=AdminUser.builder().id(UUID.randomUUID()).name("Administrador").email("admin@example.test")
            .passwordHash(encoder.encode("local-test-password")).active(active).role(AdminUser.Role.ADMIN).build();
        when(users.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        return user;
    }
    @Test void loginUsesBcryptAndIssuedTokenAccessesMeWithoutExposingPassword() throws Exception {
        user(true);
        var result=mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("{\"email\":\"admin@example.test\",\"password\":\"local-test-password\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
        String token=mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        assertThat(result.getRequest().getSession(false)).isNull();
        mvc.perform(get("/api/v1/auth/me").header("Authorization","Bearer "+token)).andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("admin@example.test"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist()).andExpect(jsonPath("$.password").doesNotExist());
    }
    @Test void incorrectPasswordAndDisabledAccountAreDenied() throws Exception {
        user(true);
        mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("{\"email\":\"admin@example.test\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.token").doesNotExist());
        user(false);
        mvc.perform(post("/api/v1/auth/login").contentType("application/json")
            .content("{\"email\":\"admin@example.test\",\"password\":\"local-test-password\"}"))
            .andExpect(status().isUnauthorized());
    }
    @Test void invalidLoginInputIsRejected() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{\"email\":\"bad\",\"password\":\"\"}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(users);
    }
    @Test void repeatedLoginAttemptsReceive429() throws Exception {
        String body="{\"email\":\"unknown@example.test\",\"password\":\"wrong\"}";
        for(int i=0;i<10;i++) {
            mvc.perform(post("/api/v1/auth/login").with(request -> {request.setRemoteAddr("127.0.0.99");return request;})
                .contentType("application/json").content(body)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/login").with(request -> {request.setRemoteAddr("127.0.0.99");return request;})
            .contentType("application/json").content(body)).andExpect(status().isTooManyRequests());
    }
}
