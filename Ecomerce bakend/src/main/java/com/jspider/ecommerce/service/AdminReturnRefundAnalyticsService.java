
package com.jspider.ecommerce.service;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.ReturnRefundAnalyticsDTO;
import com.jspider.ecommerce.enums.RefundStatus;
import com.jspider.ecommerce.enums.ReturnStatus;
import com.jspider.ecommerce.repository.RefundRepository;
import com.jspider.ecommerce.repository.ReturnRequestRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AdminReturnRefundAnalyticsService {

    private final ReturnRequestRepository returnRequestRepository;
    private final RefundRepository refundRepository;

    public ReturnRefundAnalyticsDTO getAnalytics() {

        ReturnRefundAnalyticsDTO response =
                new ReturnRefundAnalyticsDTO();

        // Return request statistics
        response.setTotalReturnRequests(
                returnRequestRepository.count());

        response.setRequestedReturns(
                returnRequestRepository.countByReturnStatus(
                        ReturnStatus.REQUESTED));

        response.setApprovedReturns(
                returnRequestRepository.countByReturnStatus(
                        ReturnStatus.APPROVED));

        response.setRejectedReturns(
                returnRequestRepository.countByReturnStatus(
                        ReturnStatus.REJECTED));

        response.setReceivedReturns(
                returnRequestRepository.countByReturnStatus(
                        ReturnStatus.RECEIVED));

        response.setCompletedReturns(
                returnRequestRepository.countByReturnStatus(
                        ReturnStatus.COMPLETED));

        // Refund statistics
        response.setTotalRefunds(refundRepository.count());

        response.setPendingRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.PENDING));

        response.setProcessingRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.PROCESSING));

        response.setSuccessfulRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.SUCCESS));

        response.setFailedRefunds(
                refundRepository.countByRefundStatus(
                        RefundStatus.FAILED));

        Double refundAmount =
                refundRepository.calculateTotalByStatus(
                        RefundStatus.SUCCESS);

        response.setTotalSuccessfulRefundAmount(
                refundAmount != null ? refundAmount : 0.0);

        return response;
    }
}
