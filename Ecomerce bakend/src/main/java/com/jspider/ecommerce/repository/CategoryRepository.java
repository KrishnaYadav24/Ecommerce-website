package com.jspider.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jspider.ecommerce.dto.CategoryRequestDto;
import com.jspider.ecommerce.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

	Category save(CategoryRequestDto requests);
	

}
