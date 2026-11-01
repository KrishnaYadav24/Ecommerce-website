
package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class SalesReportDTO {

	private Double totalRevenue;
	private long totalOrders;
	private long deliveredOrders;
	private long pendingOrders;
	private long cancelledOrders;

	private Double totalRefunds;
	private Double netRevenue;
	private long successfulPayments;
	private long successfulRefunds;
	private long pendingRefunds;

}
