package com.jspider.ecommerce.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class DateWiseSalesReportDTO {

    private LocalDate startDate;

    private LocalDate endDate;

    private Double totalRevenue;

    private long successfulPayments;
}