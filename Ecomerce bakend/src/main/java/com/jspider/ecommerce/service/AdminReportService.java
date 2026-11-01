
package com.jspider.ecommerce.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.DeliveryReportDTO;
import com.jspider.ecommerce.dto.SalesReportDTO;
import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.enums.PaymentStatus;
import com.jspider.ecommerce.enums.RefundStatus;
import com.jspider.ecommerce.repository.OrderRepositry;
import com.jspider.ecommerce.repository.PaymentRepository;
import com.jspider.ecommerce.repository.RefundRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminReportService {

    private final OrderRepositry orderRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;

    public SalesReportDTO getSalesReport() {

        SalesReportDTO response = new SalesReportDTO();

        // 1. Calculate successful payment revenue
        Double revenue = paymentRepository
                .calculateTotalByStatus(PaymentStatus.SUCCESS);

        if (revenue == null) {
            revenue = 0.0;
        }

        response.setTotalRevenue(revenue);

        // 2. Calculate successful refunds
        Double refundAmount = refundRepository
                .calculateTotalByStatus(RefundStatus.SUCCESS);

        if (refundAmount == null) {
            refundAmount = 0.0;
        }

        response.setTotalRefunds(refundAmount);

        // 3. Calculate net revenue
        response.setNetRevenue(revenue - refundAmount);

        // 4. Payment analytics
        response.setSuccessfulPayments(
                paymentRepository.countByPaymentStatus(
                        PaymentStatus.SUCCESS));

        // 5. Refund analytics
        response.setSuccessfulRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.SUCCESS));

        response.setPendingRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.PENDING));

        // 6. Order analytics
        response.setTotalOrders(orderRepository.count());

        response.setDeliveredOrders(
                orderRepository.countByStatus(
                        OrderStatus.DELIVERED));

        response.setPendingOrders(
                orderRepository.countByStatus(
                        OrderStatus.PENDING));

        response.setCancelledOrders(
                orderRepository.countByStatus(
                        OrderStatus.CANCELED));

        return response;
    }
    

public DeliveryReportDTO getDeliveryReport() {

    DeliveryReportDTO response = new DeliveryReportDTO();

    long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);

    long onTime = orderRepository.countOnTimeDeliveries(OrderStatus.DELIVERED);

    long late = orderRepository.countLateDeliveries(OrderStatus.DELIVERED);

    long overdue = orderRepository.countOverdueOrders(
            OrderStatus.DELIVERED,
            OrderStatus.CANCELED,
            LocalDate.now());

    List<Order> lateOrders =
            orderRepository.findLateDeliveredOrders(OrderStatus.DELIVERED);

    long totalDelayDays = 0;

    for (Order order : lateOrders) {
        totalDelayDays += java.time.temporal.ChronoUnit.DAYS.between(
                order.getExpectedDeliveryDate(),
                order.getActualDeliveryDate());
    }

    double averageDelay = lateOrders.isEmpty()
            ? 0.0
            : (double) totalDelayDays / lateOrders.size();

    double onTimePercentage = delivered == 0
            ? 0.0
            : (double) onTime * 100 / delivered;

    response.setTotalDeliveredOrders(delivered);
    response.setOnTimeDeliveries(onTime);
    response.setLateDeliveries(late);
    response.setOverdueOrders(overdue);
    response.setOnTimeDeliveryPercentage(onTimePercentage);
    response.setAverageDelayDays(averageDelay);

    return response;
}

}
