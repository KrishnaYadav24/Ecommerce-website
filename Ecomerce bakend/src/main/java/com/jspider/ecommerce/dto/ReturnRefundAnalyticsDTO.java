
package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class ReturnRefundAnalyticsDTO {

	private long totalReturnRequests;

	private long requestedReturns;
	private long approvedReturns;
	private long rejectedReturns;
	private long receivedReturns;
	private long completedReturns;

	private long totalRefunds;

	private long pendingRefunds;
	private long processingRefunds;
	private long successfulRefunds;
	private long failedRefunds;

	private Double totalSuccessfulRefundAmount;
}
