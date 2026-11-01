package com.jspider.ecommerce.dto;

import java.util.List;

import com.jspider.ecommerce.entity.Product;

import lombok.Data;

@Data
public class InventoryReportDTO {

    private long totalProducts;

    private long outOfStockCount;

    private long lowStockCount;

    private List<Product> outOfStockProducts;

    private List<Product> lowStockProducts;
}
