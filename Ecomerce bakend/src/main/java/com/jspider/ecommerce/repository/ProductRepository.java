package com.jspider.ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jspider.ecommerce.entity.Product;

import jakarta.persistence.LockModeType;

public interface ProductRepository
        extends JpaRepository<Product, Integer>,
                JpaSpecificationExecutor<Product> {

    // Search product by name with pagination
    Page<Product> findByNameContainingIgnoreCase(
            String name, Pageable pageable);

    // Search product by category name with pagination
    Page<Product> findByCategory_NameContainingIgnoreCase(
            String categoryName, Pageable pageable);

    // Search product by name AND category name with pagination
    Page<Product> findByNameContainingIgnoreCaseAndCategory_NameContainingIgnoreCase(
            String name,
            String categoryName,
            Pageable pageable);

    // Search products within a price range
    List<Product> findByPriceGreaterThanEqualAndPriceLessThanEqual(
            double minprice, double maxprice);

    // Count products with exact stock value
    long countByStock(Integer stock);

    // Count products with stock less than or equal to value
    long countByStockLessThanEqual(Integer stock);

    // Find products with exact stock value
    List<Product> findByStock(Integer stock);

    // Find products whose stock is less than or equal to value
    List<Product> findByStockLessThanEqual(Integer stock);

    // Lock a product row while processing an order
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :productId")
    Optional<Product> findByIdForUpdate(
            @Param("productId") Integer productId);
}