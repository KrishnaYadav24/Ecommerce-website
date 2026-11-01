
package com.jspider.ecommerce.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.Payment;
import com.jspider.ecommerce.enums.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Payment findByOrder(Order order);

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0.0)
        FROM Payment p
        WHERE p.paymentStatus = :status
    """)
    Double calculateTotalByStatus(
            @Param("status") PaymentStatus status);

    long countByPaymentStatus(PaymentStatus paymentStatus);
    
    @Query("""
    	    SELECT COALESCE(SUM(p.amount), 0.0)
    	    FROM Payment p
    	    WHERE p.paymentStatus = :status
    	      AND p.paymentDate >= :startDate
    	      AND p.paymentDate < :endDate
    	""")
    	Double calculateRevenueBetweenDates(
    	        @Param("status") PaymentStatus status,
    	        @Param("startDate") LocalDateTime startDate,
    	        @Param("endDate") LocalDateTime endDate
    	);

    	@Query("""
    	    SELECT COUNT(p)
    	    FROM Payment p
    	    WHERE p.paymentStatus = :status
    	      AND p.paymentDate >= :startDate
    	      AND p.paymentDate < :endDate
    	""")
    	long countPaymentsBetweenDates(
    	        @Param("status") PaymentStatus status,
    	        @Param("startDate") LocalDateTime startDate,
    	        @Param("endDate") LocalDateTime endDate
    	);
}
