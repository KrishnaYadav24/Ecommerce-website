
package com.jspider.ecommerce.service;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.OrderAnalyticsDTO;
import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.repository.OrderRepositry;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminOrderAnalyticsService {

    private final OrderRepositry orderRepository;

    public OrderAnalyticsDTO getOrderAnalytics() {

        OrderAnalyticsDTO response = new OrderAnalyticsDTO();

        response.setTotalOrders(orderRepository.count());

        response.setPendingOrders(
                orderRepository.countByStatus(OrderStatus.PENDING));

        response.setConfirmedOrders(
                orderRepository.countByStatus(OrderStatus.CONFIRMED));

        response.setShippedOrders(
                orderRepository.countByStatus(OrderStatus.SHIPPED));

        response.setDeliveredOrders(
                orderRepository.countByStatus(OrderStatus.DELIVERED));

        response.setCancelledOrders(
                orderRepository.countByStatus(OrderStatus.CANCELED));

        return response;
    }
}
