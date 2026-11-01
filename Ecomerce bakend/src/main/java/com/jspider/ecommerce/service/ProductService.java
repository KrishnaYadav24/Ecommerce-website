package com.jspider.ecommerce.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import com.jspider.ecommerce.dto.ProductRequestDto;
import com.jspider.ecommerce.dto.ProductResponseDTO;
import com.jspider.ecommerce.entity.Category;
import com.jspider.ecommerce.entity.Product;
import com.jspider.ecommerce.exception.CategoryNotFoundException;
import com.jspider.ecommerce.exception.ProductNotFoundException;
import com.jspider.ecommerce.mapper.ProductMapper;
import com.jspider.ecommerce.repository.CategoryRepository;
import com.jspider.ecommerce.repository.ProductRepository;
import com.jspider.ecommerce.repository.ProductSpecification;


@Service
public class ProductService {

	private final ProductRepository productRepository;
	private final ProductMapper productMapper;
	private final CategoryRepository categoryRepository;

	public ProductService(ProductRepository productRepository, ProductMapper productMapper,
			CategoryRepository categoryRepository) {
		this.productRepository = productRepository;
		this.productMapper = productMapper;
		this.categoryRepository = categoryRepository;
	}

	/*
	 * public Product addProduct(ProductRequestDto request) {
	 * 
	 * Product product = new Product();
	 * 
	 * product.setName(request.getName());
	 * product.setDescription(request.getDescription());
	 * product.setPrice(request.getPrice()); product.setStock(request.getStock());
	 * product.setCategory(request.getCategoryid());
	 * product.setMfd(request.getMfd()); return productRepository.save(product); }
	 * 
	 * public List<Product> displayProduct() {
	 * 
	 * return productRepository.findAll(); }
	 * 
	 * @Transactional public List<Product>
	 * addMultipleProduct(List<ProductRequestDto> request) {
	 * 
	 * List<Product> product = new ArrayList<>();
	 * 
	 * for (ProductRequestDto dto : request) {
	 * 
	 * Product p = new Product();
	 * 
	 * p.setName(dto.getName()); p.setDescription(dto.getDescription());
	 * p.setPrice(dto.getPrice()); p.setStock(dto.getStock());
	 * p.setCategory(dto.getCategoryid()); p.setMfd(dto.getMfd());
	 * 
	 * product.add(p); }
	 * 
	 * return productRepository.saveAll(product);
	 * 
	 * }
	 * 
	 * public Product findProductbyId(int id) { Optional<Product> optional =
	 * productRepository.findById(id);
	 * 
	 * if (optional.isPresent()) {
	 * 
	 * return optional.get(); }
	 * 
	 * throw new ProductNotFoundException( "Product with id " + id +
	 * "is not found \n\n please enter correct id and try again"); }
	 * 
	 * public Product updateProduct(int id, ProductRequestDto request) {
	 * Optional<Product> optional = productRepository.findById(id);
	 * 
	 * if (optional.isPresent()) {
	 * 
	 * Product product = optional.get(); product.setName(request.getName());
	 * product.setDescription(request.getDescription());
	 * product.setPrice(request.getPrice()); product.setStock(request.getStock());
	 * product.setCategory(request.getCategoryid());
	 * product.setMfd(request.getMfd()); return productRepository.save(product); }
	 * 
	 * throw new ProductNotFoundException( "Product with id " + id +
	 * "is not found \n\n please enter correct id and try again");
	 * 
	 * }
	 * 
	 * public void deleteProduct(int id) { Optional<Product> optional =
	 * productRepository.findById(id); if (optional.isPresent()) { Product product =
	 * optional.get(); productRepository.delete(product); } throw new
	 * ProductNotFoundException( "Product with id " + id +
	 * "is not found \n\n please enter correct id and try again"); }
	 * 
	 * public Page<ProductResponseDTO> pageNumber(int pageNumber) {
	 * 
	 * Page<Product> page = productRepository.findAll(PageRequest.of(pageNumber,
	 * 15));
	 * 
	 * return page.map(p -> productMapper.toResponse(p)); }
	 * 
	 * public Page<ProductResponseDTO> pageSortDescending(int pageno) {
	 * 
	 * Page<Product> page = productRepository .findAll(PageRequest.of(pageno, 15,
	 * Sort.by(Sort.Direction.DESC, "price"))); return page.map(p ->
	 * productMapper.toResponse(p));
	 * 
	 * }
	 * 
	 * public Page<ProductResponseDTO> pageFiltering(int pageno, int pagesize,
	 * String sortby, String direction) {
	 * 
	 * Page<Product> page = productRepository .findAll(PageRequest.of(pageno,
	 * pagesize, Sort.by(Sort.Direction.fromString(direction), sortby)));
	 * 
	 * return page.map(p -> productMapper.toResponse(p));
	 * 
	 * }
	 * 
	 * public List<Product> searching(String name){
	 * 
	 * List<Product> p = productRepository.findByNameContainingAllIgnoreCase(name);
	 * 
	 * if(p.isEmpty()) { throw new ProductNotFoundException("Product with name " +
	 * name + " is not found"); }
	 * 
	 * return p; }
	 * 
	 * public List<Product> findByCategory(String categoryName){
	 * 
	 * List<Product> p =
	 * productRepository.findByCategoryContainingAllIgnoreCase(categoryName);
	 * 
	 * if(p.isEmpty()) { throw new ProductNotFoundException("Product category name"
	 * + categoryName+ "is not mound"); } return p;
	 * 
	 * }
	 * 
	 * public List<Product> findByPrice(double minprice,double maxprice){
	 * 
	 * List<Product> p =
	 * productRepository.findByPriceGreaterThanEqualAndPriceLessThanEqual(minprice,
	 * maxprice); if(p.isEmpty()) { throw new
	 * ProductNotFoundException("Product is not available between this price range"
	 * ); } return p;
	 * 
	 * }
	 * 
	 * public Page<ProductResponseDTO> filterProducts( String category, Double
	 * minPrice, Double maxPrice, int page, int size, String sortBy, String
	 * direction) {
	 * 
	 * Specification<Product> specification = ProductSpecification.filterProducts(
	 * category, minPrice, maxPrice );
	 * 
	 * Sort.Direction sortDirection = Sort.Direction.fromString(direction);
	 * 
	 * Pageable pageable = PageRequest.of( page, size, Sort.by(sortDirection,
	 * sortBy) );
	 * 
	 * Page<Product> products = productRepository.findAll(specification, pageable);
	 * 
	 * if (products.isEmpty()) { throw new ProductNotFoundException(
	 * "No product found for the given filter" ); }
	 * 
	 * return products.map(productMapper::toResponse); }
	 */

	public ProductResponseDTO addProduct(ProductRequestDto request) {

		Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(
				() -> new CategoryNotFoundException("Category with id " + request.getCategoryId() + " not found"));

		Product product = productMapper.toEntity(request);

		product.setCategory(category);

		Product savedProduct = productRepository.save(product);

		return productMapper.toResponse(savedProduct);
	}

	public List<ProductResponseDTO> displayProduct() {

		List<Product> product = productRepository.findAll();
		List<ProductResponseDTO> response = new ArrayList<>();
		for (Product products : product) {
			ProductResponseDTO request = productMapper.toResponse(products);
			response.add(request);
		}
		return response;
	}

	public ProductResponseDTO displayProductById(int id) {

		Optional<Product> product = productRepository.findById(id);

		if (product.isEmpty()) {
			throw new ProductNotFoundException("Product with id " + id + "not found");
		}
		Product products = product.get();
		ProductResponseDTO dto = productMapper.toResponse(products);
		return dto;
	}

	public void deleteProductById(int id) {
		Optional<Product> optional = productRepository.findById(id);

		if (optional.isEmpty()) {
			throw new ProductNotFoundException("Product with id " + id + "not found");
		}

		Product product = optional.get();
		productRepository.delete(product);
	}

	public ProductResponseDTO updateProduct(int id, ProductRequestDto request) {

		Optional<Product> optional = productRepository.findById(id);
		if (optional.isEmpty()) {
			throw new ProductNotFoundException("Product with id " + id + "not found");
		}

		Product product = optional.get();

		// product = productMapper.toEntity(request);
		product.setName(request.getName());
		product.setDescription(request.getDescription());
		product.setPrice(request.getPrice());
		product.setStock(request.getStock());
		product.setMfd(request.getMfd());

		Optional<Category> category = categoryRepository.findById(request.getCategoryId());

		if (category.isEmpty()) {
			throw new CategoryNotFoundException(
					"Product with this category id " + request.getCategoryId() + "is not available");
		}
		Category categorys = category.get();
		product.setCategory(categorys);
		Product saveProduct = productRepository.save(product);
		return productMapper.toResponse(saveProduct);

	}

	public Page<ProductResponseDTO> pageFiltering(int pageno, int pagesize, String sortby, String direction) {

		Page<Product> page = productRepository
				.findAll(PageRequest.of(pageno, pagesize, Sort.by(Sort.Direction.fromString(direction), sortby)));

		return page.map(p -> productMapper.toResponse(p));

	}

	public Page<ProductResponseDTO> searching(
	        String name,
	        String categoryName,
	        int pageno,
	        int pagesize,
	        String sortby,
	        String direction) {

	    Pageable pageable = PageRequest.of(
	            pageno,
	            pagesize,
	            Sort.by(Sort.Direction.fromString(direction), sortby));

	    Page<Product> products;

	    // Search by both product name and category name
	    if (name != null && !name.isBlank()
	            && categoryName != null && !categoryName.isBlank()) {

	        products = productRepository
	                .findByNameContainingIgnoreCaseAndCategory_NameContainingIgnoreCase(
	                        name,
	                        categoryName,
	                        pageable);

	    // Search only by category name
	    } else if (categoryName != null && !categoryName.isBlank()) {

	        products = productRepository
	                .findByCategory_NameContainingIgnoreCase(
	                        categoryName,
	                        pageable);

	    // Search only by product name
	    } else if (name != null && !name.isBlank()) {

	        products = productRepository
	                .findByNameContainingIgnoreCase(
	                        name,
	                        pageable);

	    // No search filter → return all products with pagination
	    } else {

	        products = productRepository.findAll(pageable);
	    }

	    // No product found
	    if (products.isEmpty()) {
	        throw new ProductNotFoundException(
	                "No product found for the given search criteria");
	    }

	    // Convert Product Page → ProductResponseDTO Page
	    return products.map(product -> productMapper.toResponse(product));
	}
	
	public Page<ProductResponseDTO> advancedFiltering(
	        String name,
	        String categoryName,
	        Double minPrice,
	        Double maxPrice,
	        Integer minStock,
	        Integer maxStock,
	        int pageno,
	        int pagesize,
	        String sortby,
	        String direction) {

	    // Start with an empty specification
	    Specification<Product> specification =
	            (root, query, criteriaBuilder) -> null;

	    // Add name filter
	    if (name != null && !name.isBlank()) {
	        specification = specification.and(
	                ProductSpecification.hasName(name));
	    }

	    // Add category filter
	    if (categoryName != null && !categoryName.isBlank()) {
	        specification = specification.and(
	                ProductSpecification.hasCategoryName(categoryName));
	    }

	    // Add minimum price filter
	    if (minPrice != null) {
	        specification = specification.and(
	                ProductSpecification.priceGreaterThanOrEqual(minPrice));
	    }

	    // Add maximum price filter
	    if (maxPrice != null) {
	        specification = specification.and(
	                ProductSpecification.priceLessThanOrEqual(maxPrice));
	    }

	    // Add minimum stock filter
	    if (minStock != null) {
	        specification = specification.and(
	                ProductSpecification.stockGreaterThanOrEqual(minStock));
	    }

	    // Add maximum stock filter
	    if (maxStock != null) {
	        specification = specification.and(
	                ProductSpecification.stockLessThanOrEqual(maxStock));
	    }

	    Pageable pageable = PageRequest.of(
	            pageno,
	            pagesize,
	            Sort.by(
	                    Sort.Direction.fromString(direction),
	                    sortby));

	    Page<Product> products =
	            productRepository.findAll(specification, pageable);

	    if (products.isEmpty()) {
	        throw new ProductNotFoundException(
	                "No product found for the given filter criteria");
	    }

	    return products.map(product ->
	            productMapper.toResponse(product));
	}
}