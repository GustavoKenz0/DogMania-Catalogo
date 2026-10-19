package com.dogmania.api.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.net.http.*;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

class UploadServiceTest {
    private final UploadService disabled = new UploadService(false, "", "");
    @Test void rejectsHtmlDisguisedAsImageWithoutContactingStorage() {
        var file=new MockMultipartFile("file", "photo.png", "image/png", "<script>alert(1)</script>".getBytes());
        assertThatThrownBy(() -> disabled.upload(file)).isInstanceOfSatisfying(ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
    }
    @Test void rejectsEmptyAndOversizedFilesWithoutContactingStorage() {
        for(byte[] content:new byte[][]{new byte[0],new byte[5*1024*1024+1]}) {
            assertThatThrownBy(() -> disabled.upload(new MockMultipartFile("file","x.jpg","image/jpeg",content)))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode().value()).isEqualTo(400));
        }
    }
    @Test void disabledStorageReturnsUnavailableForRecognizedSignature() {
        byte[] signature={(byte)137,80,78,71,13,10,26,10};
        assertThatThrownBy(() -> disabled.upload(new MockMultipartFile("file","x.png","image/png",signature)))
            .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode().value()).isEqualTo(503));
    }
    @Test void rejectsUntrustedStorageHostsAndRedirectLikeUrls() {
        for(String url:new String[]{"http://localhost", "https://example.com", "https://project.supabase.co@attacker.invalid",
            "https://project.supabase.co/?redirect=bad", "https://project.supabase.co/path", "https://project.supabase.co:444"}) {
            assertThatThrownBy(() -> new UploadService(true,url,"test-only-key")).isInstanceOf(IllegalArgumentException.class);
        }
    }
    @Test void uploadUsesGeneratedObjectNameAndIgnoresUntrustedOriginalFilename() throws Exception {
        HttpClient client=mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<Void> response=mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(201);
        when(client.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any())).thenReturn(response);
        var service=new UploadService(true,"https://test-project.supabase.co","test-only-key",client);
        byte[] signature={(byte)137,80,78,71,13,10,26,10};
        String url=service.upload(new MockMultipartFile("file","../../malicious.html","text/html",signature));
        assertThat(url).matches("https://test-project\\.supabase\\.co/storage/v1/object/public/product-images/[a-f0-9-]{36}\\.png");
        ArgumentCaptor<HttpRequest> captor=ArgumentCaptor.forClass(HttpRequest.class);
        verify(client).send(captor.capture(),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any());
        assertThat(captor.getValue().headers().firstValue("Content-Type")).contains("image/png");
        assertThat(captor.getValue().uri().getPath()).doesNotContain("..");
    }
}
