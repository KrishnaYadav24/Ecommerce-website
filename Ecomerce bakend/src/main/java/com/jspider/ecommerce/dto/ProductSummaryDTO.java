package com.jspider.ecommerce.dto;

import lombok.Data;

@Data

public class ProductSummaryDTO {
	private Integer id;

	private String name;

	private Double price;
	
	private Integer stock;

}
