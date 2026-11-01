package com.jspider.ecommerce.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jspider.ecommerce.dto.ReturnRequestDTO;
import com.jspider.ecommerce.dto.ReturnRequestResponseDTO;
import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.OrderItem;
import com.jspider.ecommerce.entity.ReturnRequest;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.enums.ReturnStatus;
import com.jspider.ecommerce.exception.OrderAccessDeniedException;
import com.jspider.ecommerce.exception.OrderItemNotFoundException;
import com.jspider.ecommerce.exception.InvalidOrderStatusException;
import com.jspider.ecommerce.exception.InvalidReturnRequestException;
import com.jspider.ecommerce.exception.InvalidReturnStatusException;
import com.jspider.ecommerce.exception.ReturnRequestNotFoundException;
import com.jspider.ecommerce.repository.OrderItemRepository;
import com.jspider.ecommerce.repository.ReturnRequestRepository;
import com.jspider.ecommerce.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ReturnRequestService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    // =========================
    // GET LOGGED-IN USER
    // =========================

    private User getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {

            throw new UsernameNotFoundException(
                    "Please login to continue");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new UsernameNotFoundException(
                    "User not found with email: " + email);
        }

        return user;
    }

    // =========================
    // MAP ENTITY TO RESPONSE DTO
    // =========================

    private ReturnRequestResponseDTO mapToResponse(
            ReturnRequest request) {

        ReturnRequestResponseDTO response =
                new ReturnRequestResponseDTO();

        OrderItem orderItem = request.getOrderItem();

        response.setReturnRequestId(request.getId());
        response.setOrderId(request.getOrder().getId());
        response.setOrderItemId(orderItem.getId());
        response.setProductId(orderItem.getProduct().getId());
        response.setProductName(orderItem.getProduct().getName());
        response.setQuantity(request.getQuantity());
        response.setReason(request.getReason());
        response.setReturnStatus(request.getReturnStatus());
        response.setRequestDate(request.getRequestDate());

        return response;
    }

    // =========================
    // CREATE RETURN REQUEST
    // CUSTOMER
    // =========================

    @Transactional
    public ReturnRequestResponseDTO createReturnrequest(
            ReturnRequestDTO request) {

        if (request == null) {
            throw new InvalidReturnRequestException(
                    "Return request cannot be empty");
        }

        if (request.getQuantity() <= 0) {
            throw new InvalidReturnRequestException(
                    "Return quantity must be greater than zero");
        }

        if (request.getReason() == null
                || request.getReason().isBlank()) {

            throw new InvalidReturnRequestException(
                    "Return reason is required");
        }

        User user = getLoggedInUser();

        // Find purchased order item
        OrderItem orderItem = orderItemRepository
                .findById(request.getOrderItemId())
                .orElseThrow(() ->
                        new OrderItemNotFoundException(
                                "Order item not found with id "
                                        + request.getOrderItemId()));

        Order order = orderItem.getOrder();

        // Verify order ownership
        if (!order.getUser().getId().equals(user.getId())) {
            throw new OrderAccessDeniedException(
                    "You are not authorized to return this product");
        }

        // Validate return quantity
        if (request.getQuantity() > orderItem.getQuantity()) {
            throw new InvalidReturnRequestException(
                    "Return quantity cannot exceed purchased quantity");
        }

        // Cancelled orders cannot be returned
        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new InvalidOrderStatusException(
                    "Cancelled order cannot be returned");
        }

        // Return is permitted only after delivery
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new InvalidOrderStatusException(
                    "Only delivered orders can be returned");
        }

        // Create return request
        ReturnRequest returnRequest = new ReturnRequest();

        returnRequest.setUser(user);
        returnRequest.setOrder(order);
        returnRequest.setOrderItem(orderItem);
        returnRequest.setQuantity(request.getQuantity());
        returnRequest.setReason(request.getReason().trim());
        returnRequest.setReturnStatus(ReturnStatus.REQUESTED);
        returnRequest.setRequestDate(LocalDateTime.now());

        ReturnRequest savedReturn =
                returnRequestRepository.save(returnRequest);

        return mapToResponse(savedReturn);
    }

    // =========================
    // GET MY RETURN REQUESTS
    // CUSTOMER
    // =========================

    @Transactional(readOnly = true)
    public List<ReturnRequestResponseDTO> getMyReturnRequests() {

        User user = getLoggedInUser();

        List<ReturnRequestResponseDTO> responses =
                new ArrayList<>();

        List<ReturnRequest> requests =
                returnRequestRepository.findAll();

        for (ReturnRequest request : requests) {

            if (request.getUser() == null
                    || !request.getUser().getId().equals(user.getId())) {
                continue;
            }

            responses.add(mapToResponse(request));
        }

        return responses;
    }

    // =========================
    // GET ALL RETURN REQUESTS
    // ADMIN
    // =========================

    @Transactional(readOnly = true)
    public List<ReturnRequestResponseDTO> getAllReturnRequests() {

        List<ReturnRequest> requests =
                returnRequestRepository.findAll();

        List<ReturnRequestResponseDTO> responses =
                new ArrayList<>();

        for (ReturnRequest request : requests) {
            responses.add(mapToResponse(request));
        }

        return responses;
    }

    // =========================
    // ADMIN APPROVE / REJECT
    // =========================

    @Transactional
    public ReturnRequestResponseDTO updateReturnResponse(
            int returnRequestId,
            ReturnStatus status) {

        ReturnRequest returnRequest =
                returnRequestRepository
                        .findById(returnRequestId)
                        .orElseThrow(() ->
                                new ReturnRequestNotFoundException(
                                        "Return request not found with id "
                                                + returnRequestId));

        // Only REQUESTED requests can be reviewed
        if (returnRequest.getReturnStatus()
                != ReturnStatus.REQUESTED) {

            throw new InvalidReturnStatusException(
                    "Only requested returns can be approved or rejected");
        }

        // Admin can only approve or reject here
        if (status != ReturnStatus.APPROVED
                && status != ReturnStatus.REJECTED) {

            throw new InvalidReturnStatusException(
                    "Return status must be APPROVED or REJECTED");
        }

        returnRequest.setReturnStatus(status);

        ReturnRequest savedReturn =
                returnRequestRepository.save(returnRequest);

        return mapToResponse(savedReturn);
    }
}