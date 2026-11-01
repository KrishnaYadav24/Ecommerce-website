package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RequestParam;


import com.jspider.ecommerce.dto.CategoryRequestDto;
import com.jspider.ecommerce.dto.CategoryResponseDto;
import com.jspider.ecommerce.service.CategoryService;

@RestController
public class CategoryController {

	private final CategoryService categoryservice;

	public CategoryController(CategoryService categoryservice) {
		this.categoryservice = categoryservice;
	}

	@PostMapping("/addcategory")
	public CategoryResponseDto addCategory(@RequestBody CategoryRequestDto request) {

		return categoryservice.addCategory(request);
	}

	@PostMapping("/addmultiplecategory")
	public List<CategoryResponseDto> addMultipleCategory(@RequestBody List<CategoryRequestDto> requests) {

		return categoryservice.addMultipleCategory(requests);
	}

	@GetMapping("/displaycategory")
	public List<CategoryResponseDto> displayCategory() {

		return categoryservice.displayCategory();
	}

	@PutMapping("/updatecategory/{id}")
	public CategoryResponseDto updateCategory(@PathVariable int id, @RequestBody CategoryRequestDto request) {

		return categoryservice.updateCategory(id, request);
	}

	@DeleteMapping("/deletecategory/{id}")
	public void deleteCategory(@PathVariable int id) {

		categoryservice.deleteCategory(id);
	}
	@GetMapping("/page")
	public Page<CategoryResponseDto> pageFiltering(
	        @RequestParam int pageno,
	        @RequestParam int pagesize,
	        @RequestParam(required = false, defaultValue = "id") String sortby,
	        @RequestParam(required = false, defaultValue = "asc") String direction) {

	    return categoryservice.pageFiltering(
	            pageno,
	            pagesize,
	            sortby,
	            direction);
	}
}