package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.ProductRequestDto;
import com.jspider.ecommerce.dto.ProductResponseDTO;
import com.jspider.ecommerce.service.ProductService;

@RestController
public class ProductController {

	private final ProductService productService;

	public ProductController(ProductService productservice) {
		this.productService = productservice;
	}

	@PostMapping("/products")
	public ProductResponseDTO addProduct(@RequestBody ProductRequestDto request) {
		return productService.addProduct(request);
	}
	
	@GetMapping("/displayproduct")
	public List<ProductResponseDTO> displayProduct(){
		return productService.displayProduct();
	}
	/*
	@PostMapping("/savemultipleproduct")
	public List<Product> addMultipleProduct(@RequestBody List<ProductRequestDto> request) {
		return productService.addMultipleProduct(request);
	}
	*/
	
	@GetMapping("/displayproductbyid/{id}")
	public ProductResponseDTO displayProductById(@PathVariable int id) {
		return productService.displayProductById(id);
	}
	

	@PutMapping("/updateproductbyid/{id}")
	public ProductResponseDTO updateProduct(@PathVariable int id, @RequestBody ProductRequestDto product) {

		return productService.updateProduct(id, product);
	}

	@DeleteMapping("/deletemapping/{id}")
	public void deleteProduct(@PathVariable int id) {
		productService.deleteProductById(id);
		System.out.print("product deleted successfully");
	}
	
	/*
	@GetMapping("/paging")
	public Page<ProductResponseDTO> pageNumber(@RequestParam int pageNumber) {
		return productService.pageNumber(pageNumber);
	}

	@GetMapping("/descending")
	public Page<ProductResponseDTO> pageSortDescending(@RequestParam int pageno) {
		return productService.pageSortDescending(pageno);
	}
	*/
	
	@GetMapping("/pagination")
	public Page<ProductResponseDTO> pageFiltering(@RequestParam int pageno, @RequestParam int pagesize,
			@RequestParam String sortby, @RequestParam String direction) {

		return productService.pageFiltering(pageno, pagesize, sortby, direction);
	}

	@GetMapping("/searching")
	public Page<ProductResponseDTO> searching(
	        @RequestParam(required = false) String name,
	        @RequestParam(required = false) String categoryName,
	        @RequestParam int pageno,
	        @RequestParam int pagesize,
	        @RequestParam(required = false, defaultValue = "id") String sortby,
	        @RequestParam(required = false, defaultValue = "asc") String direction) {

	    return productService.searching(
	            name,
	            categoryName,
	            pageno,
	            pagesize,
	            sortby,
	            direction);
	}
	
	/*
	@GetMapping("/findbycategory")
	public List<Product> findByCategory(@RequestParam String categoryName) {
		return productService.findByCategory(categoryName);
	}

	@GetMapping("/findbyprice")
	public List<Product> findByPrice(@RequestParam double minprice, @RequestParam double maxprice) {
		return productService.findByPrice(minprice, maxprice);
	}

	@GetMapping("/findbyfilter")
	public Page<ProductResponseDTO> filterProducts(

			@RequestParam(required = false) String category,
			@RequestParam(required = false) Double minPrice,
			@RequestParam(required = false) Double maxPrice,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "asc") String direction) {

		return productService.filterProducts(category, minPrice, maxPrice, page, size, sortBy, direction);
	}
	*/
	
	@GetMapping("/advanced-filtering")
	public Page<ProductResponseDTO> advancedFiltering(

	        // Product name filter - optional
	        @RequestParam(required = false) String name,

	        // Category name filter - optional
	        @RequestParam(required = false) String categoryName,

	        // Price filters - optional
	        @RequestParam(required = false) Double minPrice,
	        @RequestParam(required = false) Double maxPrice,

	        // Stock filters - optional
	        @RequestParam(required = false) Integer minStock,
	        @RequestParam(required = false) Integer maxStock,

	        // Pagination - required
	        @RequestParam int pageno,
	        @RequestParam int pagesize,

	        // Sorting - optional
	        @RequestParam(required = false, defaultValue = "id") String sortby,
	        @RequestParam(required = false, defaultValue = "asc") String direction) {

	    return productService.advancedFiltering(
	            name,
	            categoryName,
	            minPrice,
	            maxPrice,
	            minStock,
	            maxStock,
	            pageno,
	            pagesize,
	            sortby,
	            direction);
	}
	

}
