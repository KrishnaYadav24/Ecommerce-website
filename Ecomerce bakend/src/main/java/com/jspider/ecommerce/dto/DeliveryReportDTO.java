
package com.jspider.ecommerce.dto;

import lombok.Data;

@Data
public class DeliveryReportDTO {

    private long totalDeliveredOrders;

    private long onTimeDeliveries;

    private long lateDeliveries;

    private long overdueOrders;

    private double onTimeDeliveryPercentage;

    private double averageDelayDays;
}
