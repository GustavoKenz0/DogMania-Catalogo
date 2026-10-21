package com.dogmania.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Pattern;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private UUID id;

    @NotBlank(message = "O título é obrigatório")
    @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
    @JsonAlias("name")
    private String title;

    @NotBlank(message = "A descrição é obrigatória")
    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    private String description;

    @NotNull(message = "O preço é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false, message = "Preço deve ser maior que zero")
    @Digits(integer = 8, fraction = 2, message = "Preço deve ter até 8 inteiros e 2 casas decimais")
    private BigDecimal price;

    @NotBlank(message = "A categoria é obrigatória")
    @Size(max = 50)
    private String category;

    @Size(min = 2, max = 80, message = "Subcategoria deve ter entre 2 e 80 caracteres")
    private String subcategory;

    @Size(max = 50)
    private String badge;

    @NotBlank(message = "A imagem é obrigatória")
    @Size(max = 2048)
    @Pattern(regexp = "https://[^\\s]+", message = "A imagem deve usar uma URL HTTPS")
    private String image;

    private Boolean active;
}
