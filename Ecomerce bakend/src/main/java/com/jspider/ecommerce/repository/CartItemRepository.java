package com.jspider.ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jspider.ecommerce.entity.Cart;
import com.jspider.ecommerce.entity.CartItem;
import com.jspider.ecommerce.entity.Product;

public interface CartItemRepository extends JpaRepository<CartItem, Integer>{
	
	boolean existsByCartAndProduct(Cart cart, Product product);

	CartItem findByCartAndProduct(Cart cart, Product product);
	
	List<CartItem> findByCart(Cart cart);

	
}
