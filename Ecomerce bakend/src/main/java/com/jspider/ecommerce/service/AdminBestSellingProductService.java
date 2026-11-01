
package com.jspider.ecommerce.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.BestSellingProductDTO;
import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.repository.OrderItemRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminBestSellingProductService {

    private final OrderItemRepository orderItemRepository;

    public List<BestSellingProductDTO> getBestSellingProducts() {

        List<Object[]> results =
                orderItemRepository.findBestSellingProducts(
                        OrderStatus.DELIVERED);

        List<BestSellingProductDTO> response = new ArrayList<>();

        for (Object[] row : results) {

            BestSellingProductDTO dto = new BestSellingProductDTO();

            dto.setProductId((Integer) row[0]);
            dto.setProductName((String) row[1]);
            dto.setTotalQuantitySold(((Number) row[2]).longValue());
            dto.setTotalSalesAmount(((Number) row[3]).doubleValue());

            response.add(dto);
        }

        return response;
    }
}
