
package com.jspider.ecommerce.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.enums.OrderStatus;

import jakarta.persistence.LockModeType;

public interface OrderRepositry extends JpaRepository<Order, Integer> {

    List<Order> findByUser(User user);

    // Count orders by status
    long countByStatus(OrderStatus status);

    // Existing sales-report query
    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0.0)
        FROM Order o
        WHERE o.status <> :status
    """)
    Double calculateRevenueExcludingStatus(
            @Param("status") OrderStatus status);

    // Existing sales-report query
    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status <> :status
    """)
    long countOrdersExcludingStatus(
            @Param("status") OrderStatus status);

    // Delivered on or before expected delivery date
    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status = :delivered
          AND o.actualDeliveryDate IS NOT NULL
          AND o.expectedDeliveryDate IS NOT NULL
          AND o.actualDeliveryDate <= o.expectedDeliveryDate
    """)
    long countOnTimeDeliveries(
            @Param("delivered") OrderStatus delivered);

    // Delivered after expected delivery date
    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status = :delivered
          AND o.actualDeliveryDate IS NOT NULL
          AND o.expectedDeliveryDate IS NOT NULL
          AND o.actualDeliveryDate > o.expectedDeliveryDate
    """)
    long countLateDeliveries(
            @Param("delivered") OrderStatus delivered);

    // Fetch late-delivered orders to calculate average delay
    @Query("""
        SELECT o
        FROM Order o
        WHERE o.status = :delivered
          AND o.actualDeliveryDate IS NOT NULL
          AND o.expectedDeliveryDate IS NOT NULL
          AND o.actualDeliveryDate > o.expectedDeliveryDate
    """)
    List<Order> findLateDeliveredOrders(
            @Param("delivered") OrderStatus delivered);

    // Orders past expected date that are not delivered or cancelled
    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status <> :delivered
          AND o.status <> :canceled
          AND o.expectedDeliveryDate IS NOT NULL
          AND o.expectedDeliveryDate < :today
    """)
    long countOverdueOrders(
            @Param("delivered") OrderStatus delivered,
            @Param("canceled") OrderStatus canceled,
            @Param("today") LocalDate today);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdForUpdate(
            @Param("orderId") Integer orderId);
}
