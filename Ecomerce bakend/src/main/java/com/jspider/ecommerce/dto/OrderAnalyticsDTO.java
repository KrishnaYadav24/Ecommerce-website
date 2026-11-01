
package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class OrderAnalyticsDTO {

    private long totalOrders;

    private long pendingOrders;

    private long confirmedOrders;

    private long shippedOrders;

    private long deliveredOrders;

    private long cancelledOrders;
}
