package com.jspider.ecommerce.productspecification;

import org.springframework.data.jpa.domain.Specification;

import com.jspider.ecommerce.entity.Product;

public class ProductSpecifiacation {

    // Filter by product name
    public static Specification<Product> hasName(String name) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        "%" + name.toLowerCase() + "%"
                );
    }

    // Filter by category name
    public static Specification<Product> hasCategoryName(String categoryName) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(
                        criteriaBuilder.lower(
                                root.get("category").get("name")
                        ),
                        "%" + categoryName.toLowerCase() + "%"
                );
    }

    // Filter by minimum price
    public static Specification<Product> priceGreaterThanOrEqual(Double minPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(
                        root.get("price"),
                        minPrice
                );
    }

    // Filter by maximum price
    public static Specification<Product> priceLessThanOrEqual(Double maxPrice) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(
                        root.get("price"),
                        maxPrice
                );
    }

    // Filter by minimum stock
    public static Specification<Product> stockGreaterThanOrEqual(Integer minStock) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(
                        root.get("stock"),
                        minStock
                );
    }

    // Filter by maximum stock
    public static Specification<Product> stockLessThanOrEqual(Integer maxStock) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(
                        root.get("stock"),
                        maxStock
                );
    }
    
}