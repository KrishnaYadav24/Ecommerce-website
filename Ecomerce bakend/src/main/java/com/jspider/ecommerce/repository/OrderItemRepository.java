package com.jspider.ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
	
	List<OrderItem> findByOrder(Order order);

	
	 @Query("""
		        SELECT oi.product.id, oi.product.name,
		               SUM(oi.quantity), SUM(oi.quantity * oi.price)
		        FROM OrderItem oi
		        WHERE oi.order.status = :status
		        GROUP BY oi.product.id, oi.product.name
		        ORDER BY SUM(oi.quantity) DESC
		    """)
		    List<Object[]> findBestSellingProducts(
		            @Param("status") com.jspider.ecommerce.enums.OrderStatus status);
}
