package com.dogmania.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import static org.assertj.core.api.Assertions.*;

class JwtTokenProviderTest {
    static final String SECRET="test-only-secret-key-at-least-32-bytes-long";
    final JwtTokenProvider provider=new JwtTokenProvider(SECRET,3600000);
    @Test void rejectsSignedTokensWithMissingRequiredClaims() {
        var key=Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        String noExpiration=Jwts.builder().subject("admin@example.test").issuer("dogmania-api").issuedAt(new Date()).signWith(key).compact();
        String noIssuedAt=Jwts.builder().subject("admin@example.test").issuer("dogmania-api").expiration(new Date(System.currentTimeMillis()+60000)).signWith(key).compact();
        String noSubject=Jwts.builder().issuer("dogmania-api").issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+60000)).signWith(key).compact();
        assertThat(provider.validateToken(noExpiration)).isFalse();
        assertThat(provider.validateToken(noIssuedAt)).isFalse();
        assertThat(provider.validateToken(noSubject)).isFalse();
    }
    @Test void refusesWeakKeyAndUnboundedLifetime() {
        assertThatThrownBy(() -> new JwtTokenProvider("short",3600000)).isInstanceOf(io.jsonwebtoken.security.WeakKeyException.class);
        assertThatThrownBy(() -> new JwtTokenProvider(SECRET,86400001)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new JwtTokenProvider(SECRET,100)).isInstanceOf(IllegalArgumentException.class);
    }
}
