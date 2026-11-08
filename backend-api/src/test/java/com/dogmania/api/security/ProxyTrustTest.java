package com.dogmania.api.security;

import org.apache.catalina.valves.RemoteIpValve;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.embedded.TomcatWebServerFactoryCustomizer;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class ProxyTrustTest {
    @Test
    void renderPortIsUsedAndNoProxyIsTrustedByDefault() throws IOException {
        MockEnvironment env = new MockEnvironment().withProperty("PORT", "10000");
        ServerProperties properties = serverProperties(env);
        assertThat(properties.getPort()).isEqualTo(10000);
        assertThat(valve(env, properties).getInternalProxies()).isEqualTo("(?!)");
    }

    @Test
    void forwardingCanBeEnabledOnlyForExplicitProxyAddresses() throws IOException {
        MockEnvironment env = new MockEnvironment().withProperty("DOGMANIA_TRUSTED_PROXY_REGEX", "192\\.0\\.2\\.10");
        RemoteIpValve valve = valve(env, serverProperties(env));
        assertThat(valve.getRemoteIpHeader()).isEqualTo("x-forwarded-for");
        assertThat(valve.getProtocolHeader()).isEqualTo("x-forwarded-proto");
        Pattern trusted = Pattern.compile(valve.getInternalProxies());
        assertThat(trusted.matcher("192.0.2.10").matches()).isTrue();
        assertThat(trusted.matcher("192.0.2.11").matches()).isFalse();
        assertThat(trusted.matcher("127.0.0.1").matches()).isFalse();
    }

    private ServerProperties serverProperties(MockEnvironment env) throws IOException {
        for (var source : new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yml"))) {
            env.getPropertySources().addLast(source);
        }
        return Binder.get(env).bind("server", Bindable.of(ServerProperties.class)).get();
    }

    private RemoteIpValve valve(MockEnvironment env, ServerProperties properties) {
        var factory = new TomcatServletWebServerFactory();
        new TomcatWebServerFactoryCustomizer(env, properties).customize(factory);
        return factory.getEngineValves().stream()
                .filter(RemoteIpValve.class::isInstance)
                .map(RemoteIpValve.class::cast)
                .findFirst().orElseThrow();
    }
}
