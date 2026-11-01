package com.jspider.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jspider.ecommerce.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
	
	//User findById(int id);
	User findByEmail(String name);
	boolean existsByEmail(String email);

}
