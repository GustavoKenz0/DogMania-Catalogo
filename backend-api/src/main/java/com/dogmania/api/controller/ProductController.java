package com.dogmania.api.controller;

import com.dogmania.api.dto.ProductDTO;
import com.dogmania.api.dto.AvailabilityRequest;
import com.dogmania.api.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Produtos", description = "Endpoints para consulta e gestão do catálogo de produtos Dogmania")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Listar produtos", description = "Retorna lista paginada de produtos com suporte a busca textual e filtro de categoria.")
    public ResponseEntity<Page<ProductDTO>> getProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.getProducts(q, category, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter produto por ID")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/{id}/related")
    @Operation(summary = "Obter produtos relacionados")
    public ResponseEntity<List<ProductDTO>> getRelatedProducts(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "4") int limit
    ) {
        return ResponseEntity.ok(productService.getRelatedProducts(id, limit));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar novo produto (Requer ADMIN)")
    public ResponseEntity<ProductDTO> createProduct(
            @Valid @RequestBody ProductDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "system";
        ProductDTO created = productService.createProduct(dto, adminEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Atualizar produto (Requer ADMIN)")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "system";
        ProductDTO updated = productService.updateProduct(id, dto, adminEmail);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<ProductDTO> availability(@PathVariable UUID id,
            @Valid @RequestBody AvailabilityRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.setAvailability(id, request.active(), userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Excluir produto definitivamente (Requer ADMIN)")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "system";
        productService.deleteProduct(id, adminEmail);
        return ResponseEntity.noContent().build();
    }
}
