package com.dogmania.api.controller;

import com.dogmania.api.config.SecurityConfig;
import com.dogmania.api.dto.ProductDTO;
import com.dogmania.api.security.*;
import com.dogmania.api.service.AgentOfficeService;
import com.dogmania.api.service.ProductService;
import com.dogmania.api.service.UploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.lang.NonNull;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import javax.sql.DataSource;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Production security chain and JWT parser; only business/storage dependencies are mocked. */
@WebMvcTest(controllers={ProductController.class, AdminProductController.class, AgentOfficeController.class, UploadController.class, HealthController.class}, properties={
    "dogmania.security.jwt.secret-key=test-only-secret-key-at-least-32-bytes-long",
    "dogmania.security.jwt.expiration-ms=3600000", "dogmania.cors.allowed-origins=http://localhost:8081"})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenProvider.class})
class ProductControllerTest {
    static final String SECRET="test-only-secret-key-at-least-32-bytes-long";
    static final UUID ID=UUID.fromString("00000000-0000-4000-8000-000000000001");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockitoBean ProductService products;
    @MockitoBean CustomUserDetailsService users;
    @MockitoBean UploadService uploads;
    @MockitoBean AgentOfficeService office;
    @MockitoBean DataSource dataSource;
    ProductDTO product() {
        return ProductDTO.builder().id(ID).title("Coleira").description("Coleira ajustável")
            .price(new BigDecimal("49.90")).category("Acessórios")
            .image("https://example.com/coleira.jpg").active(true).build();
    }
    @NonNull
    String json(ProductDTO payload) throws JsonProcessingException {
        return Objects.requireNonNull(mapper.writeValueAsString(payload));
    }
    String token(String email,String secret,long expires,String issuer) {
        return Jwts.builder().subject(email).issuer(issuer).issuedAt(new Date(System.currentTimeMillis()-120000)).expiration(new Date(expires))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).compact();
    }
    String auth(String role,boolean disabled) {
        when(users.loadUserByUsername("admin@example.test")).thenReturn(User.withUsername("admin@example.test")
            .password("unused").roles(role).disabled(disabled).build());
        return "Bearer "+token("admin@example.test",SECRET,System.currentTimeMillis()+60000,"dogmania-api");
    }
    @Test void officeSnapshotRequiresAnActiveAdministrator() throws Exception {
        when(office.snapshot()).thenReturn(new AgentOfficeService.Snapshot(List.of(), List.of(), null, 1L));
        String path = "/api/v1/admin/agent-office";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", auth("USER", false))).andExpect(status().isForbidden());
        mvc.perform(get(path).header("Authorization", auth("ADMIN", true))).andExpect(status().isUnauthorized());
        verify(office, never()).snapshot();
        mvc.perform(get(path).header("Authorization", auth("ADMIN", false)))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.participants").isArray());
        mvc.perform(get(path).header("Authorization", auth("SUPER_ADMIN", false))).andExpect(status().isOk());
    }

    @Test void livenessDoesNotTouchDatabaseAndReadinessUsesItWithoutExposingDetails() throws Exception {
        String authorization = "Bearer " + token("admin@example.test", SECRET,
                System.currentTimeMillis() + 60000, "dogmania-api");
        mvc.perform(get("/health/live").servletPath("/health/live").header("Authorization", authorization))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("UP"));
        verifyNoInteractions(dataSource, users);

        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection)
            .thenThrow(new SQLException("Internal database error for test"));
        when(connection.isValid(1)).thenReturn(true);
        mvc.perform(get("/health/ready").servletPath("/health/ready").header("Authorization", authorization))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("UP"));
        verify(connection).close();
        mvc.perform(get("/health/ready").servletPath("/health/ready").header("Authorization", authorization))
            .andExpect(status().isServiceUnavailable())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("DOWN"))
            .andExpect(jsonPath("$.message").doesNotExist());
        verifyNoInteractions(users);
        mvc.perform(get("/health/other")).andExpect(status().isUnauthorized());
    }

    @Test void publicCatalogDoesNotCreateSession() throws Exception {
        when(products.getProducts(any(),any(),any(Pageable.class))).thenReturn(new PageImpl<>(Objects.requireNonNull(List.of(product()))));
        var result=mvc.perform(get("/api/v1/products")).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value("Coleira")).andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
        assertThat(result.getResponse().getHeaders("Set-Cookie")).isEmpty();
    }
    @Test void unknownEndpointsAreDeniedAndSecurityHeadersArePresent() throws Exception {
        mvc.perform(get("/api/v1/admin_users")).andExpect(status().isUnauthorized())
            .andExpect(header().string("X-Content-Type-Options","nosniff"))
            .andExpect(header().string("X-Frame-Options","DENY"));
        mvc.perform(get("/api/v1/admin_users").header("Authorization",auth("ADMIN",false)))
            .andExpect(status().isForbidden());
    }
    @Test void anonymousCannotMutateOrReadAdminCatalog() throws Exception {
        String body=json(product());
        mvc.perform(post("/api/v1/products").contentType("application/json").content(body)).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/products/{id}",ID).contentType("application/json").content(body)).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/products/{id}",ID)).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/products/{id}/availability",ID).contentType("application/json").content("{\"active\":false}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/products")).andExpect(status().isUnauthorized());
        verifyNoInteractions(products);
    }
    @Test void forgedExpiredAndWrongIssuerTokensAreRejected() throws Exception {
        for(String jwt:List.of("not.a.jwt",
            token("admin@example.test","different-secret-at-least-32-bytes-long",System.currentTimeMillis()+60000,"dogmania-api"),
            token("admin@example.test",SECRET,System.currentTimeMillis()-60000,"dogmania-api"),
            token("admin@example.test",SECRET,System.currentTimeMillis()+60000,"other-api"))) {
            mvc.perform(delete("/api/v1/products/{id}",ID).header("Authorization","Bearer "+jwt)).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(products,users);
    }
    @Test void nonAdminCannotMutateOrReadAdminCatalog() throws Exception {
        String auth=auth("CUSTOMER",false);
        mvc.perform(delete("/api/v1/products/{id}",ID).header("Authorization",auth)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/products").header("Authorization",auth)).andExpect(status().isForbidden());
        verifyNoInteractions(products);
    }
    @Test void userLookupOutageReturns503ButMissingUserReturns401() throws Exception {
        String authorization = "Bearer " + token("admin@example.test", SECRET,
                System.currentTimeMillis() + 60000, "dogmania-api");
        when(users.loadUserByUsername("admin@example.test"))
            .thenThrow(new DataAccessResourceFailureException("Internal database error for test"))
            .thenThrow(new UsernameNotFoundException("User not found"));
        mvc.perform(delete("/api/v1/products/{id}", ID).header("Authorization", authorization))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("Não foi possível validar a sessão agora. Tente novamente em instantes."));
        mvc.perform(delete("/api/v1/products/{id}", ID).header("Authorization", authorization))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(products);
    }

    @Test void disabledAdminCannotReuseToken() throws Exception {
        mvc.perform(delete("/api/v1/products/{id}",ID).header("Authorization",auth("ADMIN",true))).andExpect(status().isUnauthorized());
        verifyNoInteractions(products);
    }
    @Test void adminCanCreateEditToggleDeleteWithoutSession() throws Exception {
        String auth=auth("ADMIN",false), body=json(product());
        when(products.createProduct(any(),eq("admin@example.test"))).thenReturn(product());
        when(products.updateProduct(eq(ID),any(),eq("admin@example.test"))).thenReturn(product());
        when(products.setAvailability(ID,false,"admin@example.test")).thenReturn(product());
        var result=mvc.perform(post("/api/v1/products").header("Authorization",auth).contentType("application/json").content(body))
            .andExpect(status().isCreated()).andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
        mvc.perform(put("/api/v1/products/{id}",ID).header("Authorization",auth).contentType("application/json").content(body)).andExpect(status().isOk());
        mvc.perform(patch("/api/v1/products/{id}/availability",ID).header("Authorization",auth).contentType("application/json").content("{\"active\":false}"))
            .andExpect(status().isOk());
        mvc.perform(delete("/api/v1/products/{id}",ID).header("Authorization",auth)).andExpect(status().isNoContent());
        verify(products).deleteProduct(ID,"admin@example.test");
    }
    @Test void authenticatedInvalidPayloadsDoNotReachService() throws Exception {
        String auth=auth("ADMIN",false);
        ProductDTO invalid=product(); invalid.setTitle(""); invalid.setPrice(new BigDecimal("-10"));
        mvc.perform(post("/api/v1/products").header("Authorization",auth).contentType("application/json")
            .content(json(invalid))).andExpect(status().isBadRequest());
        invalid=product(); invalid.setImage("javascript:alert(1)");
        mvc.perform(post("/api/v1/products").header("Authorization",auth).contentType("application/json")
            .content(json(invalid))).andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/products/{id}/availability",ID).header("Authorization",auth).contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(products);
    }
    @Test void corsRejectsForeignOriginAndAllowsConfiguredOrigin() throws Exception {
        mvc.perform(options("/api/v1/products").header("Origin","http://localhost:8081").header("Access-Control-Request-Method","POST")
            .header("Access-Control-Request-Headers","Authorization,Content-Type")).andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin","http://localhost:8081"));
        mvc.perform(options("/api/v1/products").header("Origin","https://attacker.invalid").header("Access-Control-Request-Method","POST"))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
    @Test void uploadRequiresAdminAndDelegatesOnlyAfterAuthentication() throws Exception {
        var file=new org.springframework.mock.web.MockMultipartFile("file","test.png","image/png",new byte[]{1});
        mvc.perform(multipart("/api/v1/uploads/image").file(file)).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/v1/uploads/image").file(file).header("Authorization",auth("CUSTOMER",false)))
            .andExpect(status().isForbidden());
        verifyNoInteractions(uploads);
        when(uploads.upload(any())).thenReturn("https://example.com/image.png");
        mvc.perform(multipart("/api/v1/uploads/image").file(file).header("Authorization",auth("ADMIN",false)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.url").value("https://example.com/image.png"));
    }
}
