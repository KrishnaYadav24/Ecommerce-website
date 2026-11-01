package com.jspider.ecommerce.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jspider.ecommerce.dto.CartItemResponseDTO;
import com.jspider.ecommerce.dto.CartRequestDTO;
import com.jspider.ecommerce.dto.CartResponseDTO;
import com.jspider.ecommerce.entity.Cart;
import com.jspider.ecommerce.entity.CartItem;
import com.jspider.ecommerce.entity.Product;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.exception.CartItemNotFoundException;
import com.jspider.ecommerce.exception.CartNotFoundException;
import com.jspider.ecommerce.exception.ProductNotFoundException;
import com.jspider.ecommerce.exception.UserNotFoundException;
import com.jspider.ecommerce.repository.CartItemRepository;
import com.jspider.ecommerce.repository.CartRepository;
import com.jspider.ecommerce.repository.ProductRepository;
import com.jspider.ecommerce.repository.UserRepository;

@Service
public class CartService {

	private final UserRepository userRepository;
	private final CartRepository cartRepository;
	private final ProductRepository productRepository;
	private final CartItemRepository cartItemRepository;

	public CartService(UserRepository userRepository, CartRepository cartRepository,
			ProductRepository productRepository, CartItemRepository cartItemRepository) {

		this.userRepository = userRepository;
		this.cartRepository = cartRepository;
		this.productRepository = productRepository;
		this.cartItemRepository = cartItemRepository;
	}

	public CartResponseDTO addToCart(CartRequestDTO request) {

		// 1. Find User
		User user = userRepository.findById(request.getUserId())
				.orElseThrow(() -> new UserNotFoundException("User not found with id " + request.getUserId()));

		// 2. Find Product
		Product product = productRepository.findById(request.getProductId())
				.orElseThrow(() -> new ProductNotFoundException("Product not found with id " + request.getProductId()));

		// 3. Find user's Cart
		Cart cart = cartRepository.findByUser(user);

		// 4. If Cart doesn't exist, create it
		if (cart == null) {
			cart = new Cart();
			cart.setUser(user);
			cart = cartRepository.save(cart);
		}

		// 5. Check whether product already exists in Cart
		CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product);

		if (cartItem != null) {

			// Product already exists → increase quantity
			cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());

		} else {

			// Product doesn't exist → create new CartItem
			cartItem = new CartItem();
			cartItem.setCart(cart);
			cartItem.setProduct(product);
			cartItem.setQuantity(request.getQuantity());
		}

		// 6. Save CartItem
		cartItemRepository.save(cartItem);

		// 7. Create CartResponseDTO
		CartResponseDTO response = new CartResponseDTO();

		response.setCartId(cart.getId());
		response.setUserId(user.getId());

		return response;
	}

	public CartResponseDTO getCart(int userId) {

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("User not found with id " + userId));

		Cart cart = cartRepository.findByUser(user);

		if (cart == null) {
			throw new CartNotFoundException("Cart not found for user id " + userId);
		}

		List<CartItem> cartItems = cartItemRepository.findByCart(cart);

		CartResponseDTO response = new CartResponseDTO();

		response.setCartId(cart.getId());
		response.setUserId(user.getId());

		List<CartItemResponseDTO> items = new ArrayList<>();

		for (CartItem item : cartItems) {

			CartItemResponseDTO itemResponse = new CartItemResponseDTO();

			itemResponse.setProductId(item.getProduct().getId());
			itemResponse.setProductName(item.getProduct().getName());
			itemResponse.setPrice(item.getProduct().getPrice());
			itemResponse.setQuantity(item.getQuantity());

			items.add(itemResponse);
		}

		response.setItems(items);

		return response;
	}

	public void removeFromCart(int userId, int productId) {

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("User not found with id " + userId));

		Cart cart = cartRepository.findByUser(user);

		if (cart == null) {
			throw new CartNotFoundException("Cart not found for user id " + userId);
		}

		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new ProductNotFoundException("Product not found with id " + productId));

		CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product);

		if (cartItem == null) {
			throw new CartItemNotFoundException("Product with id " + productId + " not found in cart");
		}

		cartItemRepository.delete(cartItem);
	}

	public void updateCart(int userId, int productId, int quantity) {

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new UserNotFoundException("User not found with id " + userId));

		Cart cart = cartRepository.findByUser(user);

		if (cart == null) {
			throw new CartNotFoundException("Cart not found for user id " + userId);
		}

		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new ProductNotFoundException("Product not found with id " + productId));

		CartItem cartItem = cartItemRepository.findByCartAndProduct(cart, product);

		if (cartItem == null) {
			throw new CartItemNotFoundException("Product with id " + productId + " not found in cart");
		}

		if (quantity <= 0) {
			throw new IllegalArgumentException("Quantity must be greater than zero");
		}

		cartItem.setQuantity(quantity);

		cartItemRepository.save(cartItem);
	}
}