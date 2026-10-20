package com.dogmania.api.repository;

import com.dogmania.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryAndActiveTrue(String category, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (:includeInactive = true OR p.active = true) " +
           "AND (:category IS NULL OR p.category = :category) " +
           "AND (:term IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:term AS string), '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:term AS string), '%')))")
    Page<Product> search(@Param("term") String term, @Param("category") String category,
                         @Param("includeInactive") boolean includeInactive, Pageable pageable);

}
