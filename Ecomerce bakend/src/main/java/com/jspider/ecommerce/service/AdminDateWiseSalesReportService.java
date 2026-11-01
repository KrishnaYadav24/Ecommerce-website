
package com.jspider.ecommerce.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.DateWiseSalesReportDTO;
import com.jspider.ecommerce.enums.PaymentStatus;
import com.jspider.ecommerce.repository.PaymentRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminDateWiseSalesReportService {

    private final PaymentRepository paymentRepository;

    public DateWiseSalesReportDTO getSalesReport(
            LocalDate startDate, LocalDate endDate) {

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required");
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date");
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.plusDays(1).atStartOfDay();

        Double revenue = paymentRepository.calculateRevenueBetweenDates(
                PaymentStatus.SUCCESS, startDateTime, endDateTime);

        long paymentCount = paymentRepository.countPaymentsBetweenDates(
                PaymentStatus.SUCCESS, startDateTime, endDateTime);

        DateWiseSalesReportDTO response = new DateWiseSalesReportDTO();

        response.setStartDate(startDate);
        response.setEndDate(endDate);
        response.setTotalRevenue(revenue != null ? revenue : 0.0);
        response.setSuccessfulPayments(paymentCount);

        return response;
    }
}
