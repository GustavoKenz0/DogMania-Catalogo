package com.dogmania.api.security;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

class LoginAttemptLimiterTest {
    @Test void eleventhAttemptIsLimitedButOtherAddressIsIndependent() {
        LoginAttemptLimiter limiter=new LoginAttemptLimiter();
        for(int i=0;i<10;i++) limiter.check("127.0.0.1");
        assertThatThrownBy(() -> limiter.check("127.0.0.1"))
            .isInstanceOfSatisfying(ResponseStatusException.class, ex ->
                assertThat(ex.getStatusCode().value()).isEqualTo(429));
        assertThatCode(() -> limiter.check("127.0.0.2")).doesNotThrowAnyException();
    }
}
