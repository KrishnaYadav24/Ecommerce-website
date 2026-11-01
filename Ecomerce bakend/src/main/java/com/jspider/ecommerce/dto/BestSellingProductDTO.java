
package com.jspider.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BestSellingProductDTO {

    private Integer productId;

    private String productName;

    private Long totalQuantitySold;

    private Double totalSalesAmount;
}
