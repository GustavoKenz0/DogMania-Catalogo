package com.dogmania.api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationTimeMs;

    public JwtTokenProvider(
            @Value("${dogmania.security.jwt.secret-key}") String secret,
            @Value("${dogmania.security.jwt.expiration-ms}") long expirationTimeMs) {
        if (secret == null || secret.isBlank() || expirationTimeMs < 60000 || expirationTimeMs > 86400000) {
            throw new IllegalArgumentException("Configure JWT_SECRET_KEY e duração JWT entre 1 minuto e 24 horas");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationTimeMs = expirationTimeMs;
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTimeMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuer("dogmania-api")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer("dogmania-api")
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer("dogmania-api")
                    .build()
                    .parseSignedClaims(token).getPayload();
            return claims.getExpiration() != null && claims.getIssuedAt() != null
                    && claims.getSubject() != null && !claims.getSubject().isBlank();
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token JWT inválido ou expirado");
            return false;
        }
    }

    public long getExpirationTimeMs() {
        return expirationTimeMs;
    }
}
