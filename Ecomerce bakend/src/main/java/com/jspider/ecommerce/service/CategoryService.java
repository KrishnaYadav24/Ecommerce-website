package com.jspider.ecommerce.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.CategoryRequestDto;
import com.jspider.ecommerce.dto.CategoryResponseDto;
import com.jspider.ecommerce.entity.Category;
import com.jspider.ecommerce.exception.CategoryNotFoundException;
import com.jspider.ecommerce.mapper.CategoryMapper;
import com.jspider.ecommerce.repository.CategoryRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import jakarta.transaction.Transactional;

@Service
public class CategoryService {

	private final CategoryRepository categoryrepository;
	private final CategoryMapper categorymapper;

	public CategoryService(CategoryRepository categoryrepository, CategoryMapper categorymapper) {
		this.categoryrepository = categoryrepository;
		this.categorymapper = categorymapper;
	}

	public CategoryResponseDto addCategory(CategoryRequestDto request) {

		Category category = categorymapper.toEntity(request);

		Category savedCategory = categoryrepository.save(category);

		return categorymapper.toResponse(savedCategory);
	}

	@Transactional
	public List<CategoryResponseDto> addMultipleCategory(List<CategoryRequestDto> requests) {

		List<Category> categories = categorymapper.toEntityList(requests);

		List<Category> savedCategories = categoryrepository.saveAll(categories);

		return categorymapper.toResponseList(savedCategories);
	}

	public List<CategoryResponseDto> displayCategory() {
	    List<Category> categories = categoryrepository.findAll();

	    return categorymapper.toResponseList(categories);
	}

	public CategoryResponseDto updateCategory(int id, CategoryRequestDto request) {

		Optional<Category> optional = categoryrepository.findById(id);

		if (optional.isPresent()) {

			Category category = optional.get();

			categorymapper.updateEntity(request, category);

			Category savedCategory = categoryrepository.save(category);

			return categorymapper.toResponse(savedCategory);
		}

		throw new CategoryNotFoundException(
				"Category with id " + id + " is not found. Please enter correct id and try again");
	}

	public void deleteCategory(int id) {
		Optional<Category> optional = categoryrepository.findById(id);

		if (optional.isEmpty()) {
			throw new CategoryNotFoundException(
					"Category with id " + id + " is not found. Please enter correct id and try again");
		}

		Category category = optional.get();
		categoryrepository.delete(category);
	}
	
	public Page<CategoryResponseDto> pageFiltering(
	        int pageno,
	        int pagesize,
	        String sortby,
	        String direction) {

	    // Pagination + Sorting
	    Pageable pageable = PageRequest.of(
	            pageno,
	            pagesize,
	            Sort.by(
	                    Sort.Direction.fromString(direction),
	                    sortby));

	    // Fetch categories with pagination and sorting
	    Page<Category> categories =
	            categoryrepository.findAll(pageable);

	    // No category found
	    if (categories.isEmpty()) {
	        throw new CategoryNotFoundException(
	                "No category found");
	    }

	    // Convert Entity Page → DTO Page
	    return categories.map(category ->
	            categorymapper.toResponse(category));
	}

}
