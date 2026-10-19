package com.dogmania.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

@Service
public class UploadService {
    private static final long MAX_BYTES = 5 * 1024 * 1024;
    private final boolean enabled;
    private final String projectUrl;
    private final String serviceKey;
    private volatile HttpClient client;

    @Autowired
    public UploadService(@Value("${dogmania.storage.enabled:false}") boolean enabled,
            @Value("${dogmania.storage.project-url:}") String projectUrl,
            @Value("${dogmania.storage.service-key:}") String serviceKey) {
        this(enabled, projectUrl, serviceKey, null);
    }

    UploadService(boolean enabled, String projectUrl, String serviceKey, HttpClient client) {
        this.enabled = enabled;
        this.projectUrl = projectUrl.replaceAll("/+$", "");
        this.serviceKey = serviceKey;
        this.client = client;
        if (enabled) {
            URI uri = URI.create(this.projectUrl);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null
                    || !uri.getHost().endsWith(".supabase.co") || uri.getUserInfo() != null
                    || uri.getPort() != -1 || !uri.getPath().isEmpty()
                    || uri.getQuery() != null || uri.getFragment() != null || serviceKey.isBlank()) {
                throw new IllegalArgumentException("Configure SUPABASE_URL HTTPS do projeto e chave de serviço para upload");
            }
        }
    }

    public String upload(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha uma imagem de até 5 MB");
        }
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > MAX_BYTES) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem excede 5 MB");
            String extension = extension(bytes);
            if (!enabled) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Upload indisponível. Configure o armazenamento ou informe uma URL HTTPS.");
            String objectName = UUID.randomUUID() + "." + extension;
            String contentType = "image/" + (extension.equals("jpg") ? "jpeg" : extension);
            HttpRequest request = HttpRequest.newBuilder(URI.create(projectUrl + "/storage/v1/object/product-images/" + objectName))
                    .timeout(Duration.ofSeconds(30)).header("Authorization", "Bearer " + serviceKey)
                    .header("apikey", serviceKey).header("Content-Type", contentType)
                    .header("x-upsert", "false").POST(HttpRequest.BodyPublishers.ofByteArray(bytes)).build();
            HttpResponse<Void> response = client().send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível salvar a imagem no armazenamento");
            }
            return projectUrl + "/storage/v1/object/public/product-images/" + objectName;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao enviar a imagem");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Envio interrompido. Tente novamente.");
        }
    }

    private HttpClient client() {
        HttpClient current = client;
        if (current == null) {
            synchronized (this) {
                current = client;
                if (current == null) {
                    current = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
                            .followRedirects(HttpClient.Redirect.NEVER).build();
                    client = current;
                }
            }
        }
        return current;
    }

    private String extension(byte[] b) {
        if (b.length >= 8 && (b[0] & 255) == 137 && b[1] == 80 && b[2] == 78 && b[3] == 71
                && b[4] == 13 && b[5] == 10 && b[6] == 26 && b[7] == 10) return "png";
        if (b.length >= 3 && (b[0] & 255) == 255 && (b[1] & 255) == 216 && (b[2] & 255) == 255) return "jpg";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato inválido. Use PNG, JPEG ou WebP.");
    }
}
