package com.jspider.ecommerce.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.RefundResponseDTO;
import com.jspider.ecommerce.entity.OrderItem;
import com.jspider.ecommerce.entity.Refund;
import com.jspider.ecommerce.entity.ReturnRequest;
import com.jspider.ecommerce.enums.RefundStatus;
import com.jspider.ecommerce.enums.ReturnStatus;
import com.jspider.ecommerce.exception.InvalidRefundStatusException;
import com.jspider.ecommerce.exception.RefundAlreadyExistsException;
import com.jspider.ecommerce.exception.RefundNotFoundException;
import com.jspider.ecommerce.exception.ReturnRequestNotFoundException;
import com.jspider.ecommerce.repository.RefundRepository;
import com.jspider.ecommerce.repository.ReturnRequestRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final ReturnRequestRepository returnRequestRepository;

    // =========================================
    // CREATE REFUND FOR AN APPROVED RETURN
    // =========================================
    public RefundResponseDTO createRefund(int returnRequestId) {

        ReturnRequest returnRequest = returnRequestRepository
                .findById(returnRequestId)
                .orElseThrow(() ->
                        new ReturnRequestNotFoundException(
                                "Return request not found with id "
                                        + returnRequestId));

        // Refund can only be created for an approved return.
        if (returnRequest.getReturnStatus() != ReturnStatus.APPROVED) {
            throw new InvalidRefundStatusException(
                    "Refund can only be created for an approved return request");
        }

        // Prevent duplicate refunds for the same return request.
        if (refundRepository.findByReturnRequest(returnRequest).isPresent()) {
            throw new RefundAlreadyExistsException(
                    "Refund already exists for this return request");
        }

        OrderItem orderItem = returnRequest.getOrderItem();

        // Refund amount = purchased item price * returned quantity.
        double refundAmount =
                orderItem.getPrice() * returnRequest.getQuantity();

        Refund refund = new Refund();

        refund.setReturnRequest(returnRequest);
        refund.setOrder(returnRequest.getOrder());
        refund.setAmount(refundAmount);
        refund.setRefundStatus(RefundStatus.PENDING);
        refund.setRefundDate(LocalDateTime.now());

        Refund savedRefund = refundRepository.save(refund);

        return convertToResponse(savedRefund);
    }

    // =========================================
    // START REFUND PROCESSING
    // =========================================
    public RefundResponseDTO processRefund(int refundId) {

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() ->
                        new RefundNotFoundException(
                                "Refund not found with id " + refundId));

        // Only pending refunds can move to processing.
        if (refund.getRefundStatus() != RefundStatus.PENDING) {
            throw new InvalidRefundStatusException(
                    "Only pending refund can be processed");
        }

        refund.setRefundStatus(RefundStatus.PROCESSING);

        Refund savedRefund = refundRepository.save(refund);

        return convertToResponse(savedRefund);
    }

    // =========================================
    // COMPLETE REFUND
    // =========================================
    public RefundResponseDTO completeRefund(int refundId) {

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() ->
                        new RefundNotFoundException(
                                "Refund not found with id " + refundId));

        // Only processing refunds can be completed.
        if (refund.getRefundStatus() != RefundStatus.PROCESSING) {
            throw new InvalidRefundStatusException(
                    "Only processing refund can be completed");
        }

        // Simulated completion; no real payment transfer occurs.
        refund.setRefundStatus(RefundStatus.SUCCESS);
        refund.setRefundDate(LocalDateTime.now());

        Refund savedRefund = refundRepository.save(refund);

        return convertToResponse(savedRefund);
    }

    // =========================================
    // GET ALL REFUNDS
    // =========================================
    public List<RefundResponseDTO> getAllRefunds() {

        List<Refund> refunds = refundRepository.findAll();
        List<RefundResponseDTO> responses = new ArrayList<>();

        for (Refund refund : refunds) {
            responses.add(convertToResponse(refund));
        }

        return responses;
    }

    // =========================================
    // CONVERT ENTITY TO RESPONSE DTO
    // =========================================
    private RefundResponseDTO convertToResponse(Refund refund) {

        RefundResponseDTO response = new RefundResponseDTO();

        response.setRefundId(refund.getId());
        response.setReturnRequestId(
                refund.getReturnRequest().getId());
        response.setOrderId(
                refund.getOrder().getId());
        response.setAmount(refund.getAmount());
        response.setRefundStatus(refund.getRefundStatus());
        response.setRefundDate(refund.getRefundDate());

        return response;
    }
}