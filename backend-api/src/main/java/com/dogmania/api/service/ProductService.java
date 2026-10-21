package com.dogmania.api.service;

import com.dogmania.api.dto.ProductDTO;
import com.dogmania.api.exception.ResourceNotFoundException;
import com.dogmania.api.model.Product;
import com.dogmania.api.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import java.util.Set;
import java.util.Objects;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final AuditService auditService;

    public ProductService(ProductRepository productRepository, AuditService auditService) {
        this.productRepository = productRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProducts(String query, String category, Pageable pageable) {
        Page<Product> products;
        if (query != null && !query.trim().isEmpty()) {
            products = productRepository.search(query.trim(), normalizedCategory(category), false, safePage(pageable));
        } else if (category != null && !category.trim().equalsIgnoreCase("Todos") && !category.trim().isEmpty()) {
            products = productRepository.findByCategoryAndActiveTrue(category.trim(), safePage(pageable));
        } else {
            products = productRepository.findByActiveTrue(safePage(pageable));
        }
        return products.map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(UUID id) {
        Product product = productRepository.findById(Objects.requireNonNull(id, "O ID do produto é obrigatório")).filter(p -> Boolean.TRUE.equals(p.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com o ID: " + id));
        return toDTO(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getRelatedProducts(UUID id, int limit) {
        Product current = productRepository.findById(Objects.requireNonNull(id, "O ID do produto é obrigatório")).filter(p -> Boolean.TRUE.equals(p.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com o ID: " + id));

        if (limit < 1 || limit > 20) throw new IllegalArgumentException("Limite deve estar entre 1 e 20");
        return productRepository.findByCategoryAndActiveTrue(current.getCategory(), Pageable.ofSize(limit + 1))
                .getContent()
                .stream()
                .filter(p -> !p.getId().equals(id))
                .limit(limit)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO dto, String performedBy) {
        Product product = Product.builder()
                .name(dto.getTitle().trim())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .category(dto.getCategory())
                .subcategory(normalizedSubcategory(dto.getSubcategory()))
                .badge(dto.getBadge())
                .image(dto.getImage())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        Product saved = productRepository.save(product);
        auditService.logAction("CREATE_PRODUCT", "Product", saved.getId(), performedBy, "Criado produto " + saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public ProductDTO updateProduct(UUID id, ProductDTO dto, String performedBy) {
        Product product = productRepository.findById(Objects.requireNonNull(id, "O ID do produto é obrigatório"))
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com o ID: " + id));

        product.setName(dto.getTitle().trim());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setCategory(dto.getCategory());
        product.setSubcategory(normalizedSubcategory(dto.getSubcategory()));
        product.setBadge(dto.getBadge());
        product.setImage(dto.getImage());
        if (dto.getActive() != null) {
            product.setActive(dto.getActive());
        }

        Product updated = productRepository.save(product);
        auditService.logAction("UPDATE_PRODUCT", "Product", updated.getId(), performedBy, "Atualizado produto " + updated.getName());
        return toDTO(updated);
    }

    @Transactional
    public void deleteProduct(UUID id, String performedBy) {
        Product product = productRepository.findById(Objects.requireNonNull(id, "O ID do produto é obrigatório"))
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com o ID: " + id));

        productRepository.delete(Objects.requireNonNull(product));
        auditService.logAction("DELETE_PRODUCT", "Product", product.getId(), performedBy, "Excluído produto " + product.getName());
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getAdminProducts(String query, String category, Pageable pageable) {
        return productRepository.search(query == null || query.isBlank() ? null : query.trim(),
                normalizedCategory(category), true, safePage(pageable)).map(this::toDTO);
    }

    @Transactional
    public ProductDTO setAvailability(UUID id, boolean active, String performedBy) {
        Product product = productRepository.findById(Objects.requireNonNull(id, "O ID do produto é obrigatório"))
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        product.setActive(active);
        Product saved = productRepository.save(product);
        auditService.logAction("SET_AVAILABILITY", "Product", id, performedBy, "active=" + active);
        return toDTO(saved);
    }

    private String normalizedSubcategory(String subcategory) {
        return subcategory == null || subcategory.isBlank() ? null : subcategory.trim();
    }

    private String normalizedCategory(String category) {
        return category == null || category.isBlank() || category.equalsIgnoreCase("Todos") ? null : category.trim();
    }

    private Pageable safePage(Pageable pageable) {
        Set<String> allowed = Set.of("createdAt", "updatedAt", "name", "price", "category", "sortOrder", "id");
        if (pageable.getSort().stream().anyMatch(order -> !allowed.contains(order.getProperty()))) {
            throw new IllegalArgumentException("Campo de ordenação inválido");
        }
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), pageable.getSort());
    }

    private ProductDTO toDTO(Product entity) {
        return ProductDTO.builder()
                .id(entity.getId())
                .title(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .category(entity.getCategory())
                .subcategory(entity.getSubcategory())
                .badge(entity.getBadge())
                .image(entity.getImage())
                .active(entity.getActive())
                .build();
    }
}
