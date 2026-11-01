package com.jspider.ecommerce.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jspider.ecommerce.entity.Refund;
import com.jspider.ecommerce.entity.ReturnRequest;
import com.jspider.ecommerce.enums.RefundStatus;

public interface RefundRepository extends JpaRepository<Refund, Integer> {

    Optional<Refund> findByReturnRequest(ReturnRequest returnRequest);
    
    @Query("""
            SELECT COALESCE(SUM(r.amount), 0.0)
            FROM Refund r
            WHERE r.refundStatus = :status
        """)
        Double calculateTotalByStatus(
                @Param("status") RefundStatus status);

        long countByRefundStatus(RefundStatus refundStatus);
}