package com.jspider.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jspider.ecommerce.entity.Cart;
import com.jspider.ecommerce.entity.User;

public interface CartRepository extends JpaRepository<Cart, Integer>{

	Cart findByUser(User user);

	Cart save(User user);

}
