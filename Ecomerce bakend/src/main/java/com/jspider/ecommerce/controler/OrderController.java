
package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.BuyNowRequestDTO;
import com.jspider.ecommerce.dto.OrderResponseDTO;
import com.jspider.ecommerce.dto.OrderStatusUpdateDTO;
import com.jspider.ecommerce.dto.PlaceOrderRequestDTO;
import com.jspider.ecommerce.service.OrderService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
public class OrderController {

    private final OrderService orderService;

    // Customer: checkout using cart
    @PostMapping("/orders")
    public OrderResponseDTO placeOrder(
            @Valid @RequestBody PlaceOrderRequestDTO request) {

        return orderService.placeOrder(request);
    }

    // Customer: direct purchase
    @PostMapping("/orders/buy-now")
    public OrderResponseDTO buyNow(
            @Valid @RequestBody BuyNowRequestDTO request) {

        return orderService.buyNow(request);
    }

    // Customer: view own orders
    @GetMapping("/orders/my")
    public List<OrderResponseDTO> getMyOrders() {
        return orderService.getMyOrders();
    }

    // Admin: view all customers' orders
    @GetMapping("/admin/orders")
    public List<OrderResponseDTO> getAllOrdersForAdmin() {
        return orderService.getAllOrdersForAdmin();
    }

    // Customer: view a particular own order
    @GetMapping("/orders/{orderId}")
    public OrderResponseDTO getOrderById(
            @PathVariable int orderId) {

        return orderService.getOrderById(orderId);
    }

    // Customer: cancel own order, subject to business rules
    @DeleteMapping("/orders/{orderId}")
    public String cancelOrder(
            @PathVariable int orderId) {

        orderService.cancelOrder(orderId);
        return "Order cancelled successfully";
    }

    // Admin: update delivery status
    @PutMapping("/admin/orders/{orderId}/status")
    public String updateOrderStatus(
            @PathVariable int orderId,
            @RequestBody OrderStatusUpdateDTO request) {

        orderService.updateOrderStatus(
                orderId,
                request.getStatus());

        return "Order status updated successfully";
    }
}
