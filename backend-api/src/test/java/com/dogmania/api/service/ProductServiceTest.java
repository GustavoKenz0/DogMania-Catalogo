package com.dogmania.api.service;

import com.dogmania.api.dto.ProductDTO;
import com.dogmania.api.exception.ResourceNotFoundException;
import com.dogmania.api.model.Product;
import com.dogmania.api.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Objects;
import org.springframework.lang.NonNull;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ProductService productService;

    @NonNull
    private final UUID productId = Objects.requireNonNull(UUID.randomUUID());

    @NonNull
    private final Product product = Product.builder()
                .id(productId)
                .name("Ração Golden Special Cães Adultos 15kg")
                .description("Ração premium especial completa")
                .price(new BigDecimal("159.90"))
                .category("Rações")
                .badge("Mais Vendido")
                .image("https://images.unsplash.com/photo-test")
                .active(true)
                .build();

    // Mockito retorna um sentinela nulo ao registrar o matcher; não é uma entidade real.
    // A exceção de análise fica restrita a este adaptador, usado somente em stubs/verificações.
    @NonNull
    @SuppressWarnings("null")
    private static Product anyProduct() {
        return any(Product.class);
    }
    @Test
    @DisplayName("Deve buscar produto por ID com sucesso quando existir")
    void shouldFindProductByIdWhenExists() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        ProductDTO result = productService.getProductById(productId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(productId);
        assertThat(result.getTitle()).isEqualTo("Ração Golden Special Cães Adultos 15kg");
        verify(productRepository, times(1)).findById(productId);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando produto não existir")
    void shouldThrowExceptionWhenProductNotFound() {
        UUID nonExistentId = Objects.requireNonNull(UUID.randomUUID());
        when(productRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(nonExistentId.toString());
    }

    @Test
    @DisplayName("Deve listar produtos ativos com paginação")
    void shouldListActiveProductsWithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(Objects.requireNonNull(List.of(product)), pageable, 1);
        when(productRepository.findByActiveTrue(pageable)).thenReturn(page);

        Page<ProductDTO> result = productService.getProducts(null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo(product.getName());
    }

    @Test
    @DisplayName("Deve criar produto e disparar registro de auditoria")
    void shouldCreateProductAndRecordAudit() {
        ProductDTO dto = ProductDTO.builder()
                .title("Brinquedo Mordedor Osso")
                .description("Mordedor resistente")
                .price(new BigDecimal("29.90"))
                .category("Brinquedos")
                .active(true)
                .build();

        when(productRepository.save(anyProduct())).thenReturn(product);

        ProductDTO created = productService.createProduct(dto, "admin@dogmania.com.br");

        assertThat(created).isNotNull();
        verify(productRepository, times(1)).save(anyProduct());
        verify(auditService, times(1)).logAction(eq("CREATE_PRODUCT"), eq("Product"), any(), eq("admin@dogmania.com.br"), anyString());
    }

    @Test
    @DisplayName("Deve excluir definitivamente o produto com auditoria")
    void shouldDeleteProduct() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        productService.deleteProduct(productId, "admin@dogmania.com.br");

        verify(productRepository).delete(product);
        verify(auditService).logAction(eq("DELETE_PRODUCT"), eq("Product"), eq(productId), eq("admin@dogmania.com.br"), anyString());
    }

    @Test
    void inactiveProductIsNotExposedByPublicDetail() {
        product.setActive(false);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        assertThatThrownBy(() -> productService.getProductById(productId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void availabilityCanBeChangedWithoutDeletingProduct() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        assertThat(productService.setAvailability(productId, false, "admin@example.test").getActive()).isFalse();
        assertThat(productService.setAvailability(productId, true, "admin@example.test").getActive()).isTrue();
        verify(productRepository, never()).delete(anyProduct());
    }

    @Test
    void unsafeSortFieldIsRejectedBeforeQuery() {
        assertThatThrownBy(() -> productService.getProducts(null, null,
                PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("passwordHash"))))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(productRepository);
    }

    @Test
    void pageSizeIsCappedAndQueryUsesRepositoryParameter() {
        String probe = "' OR '1'='1";
        when(productRepository.search(eq(probe), isNull(), eq(false), any(Pageable.class)))
                .thenReturn(Page.empty());
        productService.getProducts(probe, null, PageRequest.of(0, 1000));
        verify(productRepository).search(eq(probe), isNull(), eq(false),
                argThat(page -> page.getPageSize() == 100));
    }
}
