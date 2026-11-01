
package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.PaymentRequestDTO;
import com.jspider.ecommerce.dto.PaymentResponseDTO;
import com.jspider.ecommerce.service.PaymentService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Customer: initiate payment for own order
    @PostMapping("/payments/{orderId}")
    public PaymentResponseDTO makePayment(
            @PathVariable int orderId,
            @RequestBody PaymentRequestDTO request) {

        return paymentService.makePayment(orderId, request);
    }

    // Customer: view payment for own order
    @GetMapping("/payments/{orderId}")
    public PaymentResponseDTO getPaymentByOrderId(
            @PathVariable int orderId) {

        return paymentService.getPaymentByOrderId(orderId);
    }

    // Admin: view all recorded payments
    @GetMapping("/admin/payments")
    public List<PaymentResponseDTO> getAllPaymentsForAdmin() {
        return paymentService.getAllPaymentsForAdmin();
    }

    // Admin: record actual COD collection after delivery
    @PatchMapping("/admin/payments/{orderId}/cod-collection")
    public PaymentResponseDTO markCodPaymentCollected(
            @PathVariable int orderId) {

        return paymentService.markCodPaymentCollected(orderId);
    }
}
