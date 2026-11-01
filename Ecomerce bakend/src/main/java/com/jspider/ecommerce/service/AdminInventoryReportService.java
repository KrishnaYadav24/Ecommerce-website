
package com.jspider.ecommerce.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.InventoryReportDTO;
import com.jspider.ecommerce.entity.Product;
import com.jspider.ecommerce.repository.ProductRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminInventoryReportService {

    private final ProductRepository productRepository;

    public InventoryReportDTO getInventoryReport() {

        InventoryReportDTO response = new InventoryReportDTO();

        List<Product> outOfStockProducts =
                productRepository.findByStock(0);

        List<Product> lowStockProducts =
                productRepository.findByStockLessThanEqual(10)
                        .stream()
                        .filter(product -> product.getStock() != null
                                && product.getStock() > 0)
                        .toList();

        response.setTotalProducts(productRepository.count());

        response.setOutOfStockCount(outOfStockProducts.size());
        response.setOutOfStockProducts(outOfStockProducts);

        response.setLowStockCount(lowStockProducts.size());
        response.setLowStockProducts(lowStockProducts);

        return response;
    }
}
