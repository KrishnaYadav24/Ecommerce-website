package com.jspider.ecommerce.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jspider.ecommerce.dto.PaymentRequestDTO;
import com.jspider.ecommerce.dto.PaymentResponseDTO;
import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.Payment;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.enums.PaymentMethod;
import com.jspider.ecommerce.enums.PaymentStatus;
import com.jspider.ecommerce.exception.UserNotFoundException;
import com.jspider.ecommerce.exception.OrderNotFoundException;
import com.jspider.ecommerce.exception.OrderAccessDeniedException;
import com.jspider.ecommerce.exception.InvalidOrderStatusException;
import com.jspider.ecommerce.exception.PaymentNotFoundException;
import com.jspider.ecommerce.exception.PaymentAlreadyExistsException;
import com.jspider.ecommerce.repository.OrderRepositry;
import com.jspider.ecommerce.repository.PaymentRepository;
import com.jspider.ecommerce.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepositry orderRepository;
    private final UserRepository userRepository;

    // =====================================================
    // CREATE PAYMENT
    // =====================================================

    /**
     * COD:
     * Payment remains PENDING until the cash is actually collected.
     *
     * UPI / CARD / NET_BANKING:
     * SUCCESS is simulated for development only.
     * This is not real payment-gateway verification.
     */
    @Transactional
    public PaymentResponseDTO makePayment(
            int orderId,
            PaymentRequestDTO request) {

        if (request == null || request.getPaymentMethod() == null) {
            throw new IllegalArgumentException(
                    "A payment method is required");
        }

        User user = getAuthenticatedUser();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        validateOrderOwnership(order, user);

        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new InvalidOrderStatusException(
                    "A cancelled order cannot be paid");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new InvalidOrderStatusException(
                    "A delivered order cannot be paid again");
        }

        Payment existingPayment = paymentRepository.findByOrder(order);

        if (existingPayment != null) {
            throw new PaymentAlreadyExistsException(
                    "A payment record already exists for order id: "
                            + orderId);
        }

        Payment payment = new Payment();

        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(request.getPaymentMethod());

        boolean cashOnDelivery =
                request.getPaymentMethod() == PaymentMethod.COD;

        if (cashOnDelivery) {

            payment.setPaymentStatus(PaymentStatus.PENDING);

            // Payment date remains null until COD is collected.

        } else {

            // DEVELOPMENT SIMULATION ONLY.
            // Replace this with verified gateway results before production.
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());
        }

        Payment savedPayment = paymentRepository.save(payment);

        // COD orders can be confirmed while payment is still pending.
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        return mapToResponse(savedPayment, order);
    }

    // =====================================================
    // GET PAYMENT FOR CUSTOMER'S OWN ORDER
    // =====================================================

    @Transactional(readOnly = true)
    public PaymentResponseDTO getPaymentByOrderId(int orderId) {

        User user = getAuthenticatedUser();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        validateOrderOwnership(order, user);

        Payment payment = paymentRepository.findByOrder(order);

        if (payment == null) {
            throw new PaymentNotFoundException(
                    "No payment record exists for order id: " + orderId);
        }

        return mapToResponse(payment, order);
    }

    // =====================================================
    // GET ALL PAYMENTS FOR ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> getAllPaymentsForAdmin() {

        requireAdmin();

        return paymentRepository.findAll()
                .stream()
                .map(payment -> mapToResponse(
                        payment,
                        payment.getOrder()))
                .toList();
    }

    // =====================================================
    // MARK COD PAYMENT AS COLLECTED
    // =====================================================

    /**
     * Admin may record COD collection only after the order
     * is delivered and the cash has actually been received.
     */
    @Transactional
    public PaymentResponseDTO markCodPaymentCollected(int orderId) {

        requireAdmin();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new InvalidOrderStatusException(
                    "COD collection can be recorded only after delivery");
        }

        Payment payment = paymentRepository.findByOrder(order);

        if (payment == null) {
            throw new PaymentNotFoundException(
                    "No payment record exists for order id: " + orderId);
        }

        if (payment.getPaymentMethod() != PaymentMethod.COD) {
            throw new InvalidOrderStatusException(
                    "This order does not use Cash on Delivery");
        }

        // Idempotent: do not overwrite the original collection date.
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return mapToResponse(payment, order);
        }

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new InvalidOrderStatusException(
                    "Only pending COD payments can be collected");
        }

        // Call this operation only after actual cash receipt.
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(savedPayment, order);
    }

    // =====================================================
    // AUTHENTICATED USER
    // =====================================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {

            throw new OrderAccessDeniedException(
                    "Authentication is required to access payment details");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new UserNotFoundException(
                    "Authenticated user does not exist");
        }

        return user;
    }

    // =====================================================
    // ADMIN AUTHORIZATION
    // =====================================================

    private void requireAdmin() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority ->
                                "ROLE_ADMIN".equals(authority.getAuthority())
                                || "ADMIN".equals(authority.getAuthority()));

        if (!isAdmin) {
            throw new OrderAccessDeniedException(
                    "Only an administrator can access this operation");
        }
    }

    // =====================================================
    // ORDER OWNERSHIP VALIDATION
    // =====================================================

    private void validateOrderOwnership(Order order, User user) {

        if (order.getUser() == null
                || order.getUser().getId() == null
                || user.getId() == null
                || !Objects.equals(
                        order.getUser().getId(),
                        user.getId())) {

            throw new OrderAccessDeniedException(
                    "You are not authorized to access this order's payment");
        }
    }

    // =====================================================
    // PAYMENT RESPONSE MAPPER
    // =====================================================

    private PaymentResponseDTO mapToResponse(
            Payment payment,
            Order order) {

        PaymentResponseDTO response = new PaymentResponseDTO();

        response.setPaymentId(payment.getId());
        response.setOrderId(order.getId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setPaymentStatus(payment.getPaymentStatus());
        response.setPaymentDate(payment.getPaymentDate());

        return response;
    }
}