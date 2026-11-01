package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.CartRequestDTO;
import com.jspider.ecommerce.dto.CartResponseDTO;
import com.jspider.ecommerce.service.CartService;

@RestController
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/addtocart")
    public CartResponseDTO addToCart(@RequestBody CartRequestDTO request) {
        return cartService.addToCart(request);
    }

    @GetMapping("/getcart/{userId}")
    public CartResponseDTO getCart(@PathVariable int userId) {
        return cartService.getCart(userId);
    }

    @DeleteMapping("/removefromcart/{userId}/{productId}")
    public void removeFromCart(
            @PathVariable int userId,
            @PathVariable int productId) {

        cartService.removeFromCart(userId, productId);
    }

    @PutMapping("/updatecart/{userId}/{productId}/{quantity}")
    public void updateCart(
            @PathVariable int userId,
            @PathVariable int productId,
            @PathVariable int quantity) {

        cartService.updateCart(userId, productId, quantity);
    }
}