package com.jspider.ecommerce.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jspider.ecommerce.dto.BuyNowRequestDTO;
import com.jspider.ecommerce.dto.OrderItemResponseDTO;
import com.jspider.ecommerce.dto.OrderResponseDTO;
import com.jspider.ecommerce.dto.PlaceOrderRequestDTO;
import com.jspider.ecommerce.dto.ReturnRequestResponseDTO;

import com.jspider.ecommerce.entity.Address;
import com.jspider.ecommerce.entity.Cart;
import com.jspider.ecommerce.entity.CartItem;
import com.jspider.ecommerce.entity.Order;
import com.jspider.ecommerce.entity.OrderItem;
import com.jspider.ecommerce.entity.Payment;
import com.jspider.ecommerce.entity.Product;
import com.jspider.ecommerce.entity.ReturnRequest;
import com.jspider.ecommerce.entity.User;

import com.jspider.ecommerce.enums.OrderStatus;
import com.jspider.ecommerce.enums.PaymentMethod;
import com.jspider.ecommerce.enums.PaymentStatus;

import com.jspider.ecommerce.exception.CartEmptyException;
import com.jspider.ecommerce.exception.CartNotFoundException;
import com.jspider.ecommerce.exception.InsufficientStockException;
import com.jspider.ecommerce.exception.InvalidOrderStatusException;
import com.jspider.ecommerce.exception.OrderAccessDeniedException;
import com.jspider.ecommerce.exception.OrderNotFoundException;
import com.jspider.ecommerce.exception.ProductNotFoundException;
import com.jspider.ecommerce.exception.UserNotFoundException;

import com.jspider.ecommerce.repository.AddressRepository;
import com.jspider.ecommerce.repository.CartItemRepository;
import com.jspider.ecommerce.repository.CartRepository;
import com.jspider.ecommerce.repository.OrderItemRepository;
import com.jspider.ecommerce.repository.OrderRepositry;
import com.jspider.ecommerce.repository.PaymentRepository;
import com.jspider.ecommerce.repository.ProductRepository;
import com.jspider.ecommerce.repository.ReturnRequestRepository;
import com.jspider.ecommerce.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class OrderService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepositry orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;

    // =====================================================
    // PLACE ORDER FROM CART
    // =====================================================

    @Transactional
    public OrderResponseDTO placeOrder(PlaceOrderRequestDTO request) {

        User user = getAuthenticatedUser();

        if (request == null
                || request.getAddressId() == null
                || request.getAddressId() <= 0) {
            throw new IllegalArgumentException(
                    "A valid delivery address is required");
        }

        Address deliveryAddress = addressRepository
                .findByIdAndUser(request.getAddressId(), user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Delivery address not found for the current user"));

        Cart cart = cartRepository.findByUser(user);

        if (cart == null) {
            throw new CartNotFoundException(
                    "Cart not found for the current user");
        }

        List<CartItem> cartItems = cartItemRepository.findByCart(cart);

        if (cartItems == null || cartItems.isEmpty()) {
            throw new CartEmptyException(
                    "Cannot place order because the cart is empty");
        }

        Map<Integer, Integer> quantities = new LinkedHashMap<>();

        for (CartItem cartItem : cartItems) {
            quantities.merge(
                    cartItem.getProduct().getId(),
                    cartItem.getQuantity(),
                    Integer::sum);
        }

        return createOrder(
                user,
                quantities,
                cartItems,
                deliveryAddress);
    }

    // =====================================================
    // BUY NOW
    // =====================================================

    @Transactional
    public OrderResponseDTO buyNow(BuyNowRequestDTO request) {

        User user = getAuthenticatedUser();

        if (request == null
                || request.getProductId() == null
                || request.getProductId() <= 0) {
            throw new IllegalArgumentException(
                    "A valid product ID is required");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than zero");
        }

        Map<Integer, Integer> quantities = new LinkedHashMap<>();
        quantities.put(request.getProductId(), request.getQuantity());

        // Buy Now does not clear the customer's cart.
        // Address/checkout navigation is handled separately.
        return createOrder(user, quantities, null, null);
    }

    // =====================================================
    // AUTHENTICATED USER
    // =====================================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new OrderAccessDeniedException(
                    "Please log in before accessing orders");
        }

        User user = userRepository.findByEmail(authentication.getName());

        if (user == null) {
            throw new UserNotFoundException(
                    "Authenticated user does not exist");
        }

        return user;
    }

    // =====================================================
    // ADMIN AUTHORIZATION
    // =====================================================

    private void requireAdmin() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = authentication != null
                && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority ->
                                "ROLE_ADMIN".equals(authority.getAuthority())
                                || "ADMIN".equals(authority.getAuthority()));

        if (!isAdmin) {
            throw new OrderAccessDeniedException(
                    "Only an administrator can perform this operation");
        }
    }

    // =====================================================
    // COMMON ORDER CREATION
    // =====================================================

    private OrderResponseDTO createOrder(
            User user,
            Map<Integer, Integer> quantities,
            List<CartItem> cartItemsToClear,
            Address deliveryAddress) {

        if (quantities == null || quantities.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one product is required");
        }

        Map<Integer, Product> products = new LinkedHashMap<>();

        // Lock products in ascending ID order.
        List<Integer> sortedProductIds =
                new ArrayList<>(quantities.keySet());

        sortedProductIds.sort(Integer::compareTo);

        // Validate stock for all products before changing inventory.
        for (Integer productId : sortedProductIds) {

            Integer quantity = quantities.get(productId);

            if (quantity == null || quantity <= 0) {
                throw new IllegalArgumentException(
                        "Quantity must be greater than zero");
            }

            Product product = productRepository
                    .findByIdForUpdate(productId)
                    .orElseThrow(() -> new ProductNotFoundException(
                            "Product not found with id " + productId));

            if (product.getStock() == null
                    || product.getStock() < quantity) {
                throw new InsufficientStockException(
                        "Insufficient stock for product: "
                                + product.getName());
            }

            products.put(productId, product);
        }

        Order order = new Order();

        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(0.0);
        order.setOrderDate(LocalDateTime.now());
        order.setExpectedDeliveryDate(LocalDate.now().plusDays(5));
        order.setActualDeliveryDate(null);

        // Save an order-time snapshot of the delivery address.
        if (deliveryAddress != null) {
            order.setDeliveryFullName(deliveryAddress.getFullName());
            order.setDeliveryEmail(deliveryAddress.getEmail());
            order.setDeliveryPhone(deliveryAddress.getPhone());
            order.setDeliveryHouseAddress(
                    deliveryAddress.getHouseAddress());
            order.setDeliveryArea(deliveryAddress.getArea());
            order.setDeliveryLandmark(deliveryAddress.getLandmark());
            order.setDeliveryPincode(deliveryAddress.getPincode());
            order.setDeliveryCity(deliveryAddress.getCity());
            order.setDeliveryState(deliveryAddress.getState());
            order.setDeliveryAddressType(
                    deliveryAddress.getAddressType());
        }

        Order savedOrder = orderRepository.save(order);

        double totalAmount = 0.0;
        List<OrderItemResponseDTO> responseItems = new ArrayList<>();

        for (Map.Entry<Integer, Integer> entry : quantities.entrySet()) {

            Product product = products.get(entry.getKey());
            Integer quantity = entry.getValue();

            double itemTotal = product.getPrice() * quantity;
            totalAmount += itemTotal;

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);

            // Preserve price at the time the order was placed.
            orderItem.setPrice(product.getPrice());

            // Save order item and obtain its generated database ID.
            OrderItem savedOrderItem =
                    orderItemRepository.save(orderItem);

            // Reduce stock inside the transaction.
            product.setStock(product.getStock() - quantity);
            productRepository.save(product);

            OrderItemResponseDTO itemResponse =
                    new OrderItemResponseDTO();

            // Required for customer return/refund requests.
            itemResponse.setOrderItemId(savedOrderItem.getId());

            itemResponse.setProductId(product.getId());
            itemResponse.setProductName(product.getName());
            itemResponse.setPrice(product.getPrice());
            itemResponse.setQuantity(quantity);

            responseItems.add(itemResponse);
        }

        savedOrder.setTotalAmount(totalAmount);
        savedOrder = orderRepository.save(savedOrder);

        // Only cart checkout clears the cart.
        if (cartItemsToClear != null) {
            for (CartItem cartItem : cartItemsToClear) {
                cartItemRepository.delete(cartItem);
            }
        }

        OrderResponseDTO response = new OrderResponseDTO();

        response.setOrderId(savedOrder.getId());
        response.setTotalAmount(savedOrder.getTotalAmount());
        response.setStatus(savedOrder.getStatus());
        response.setOrderDate(savedOrder.getOrderDate());
        response.setExpectedDeliveryDate(
                savedOrder.getExpectedDeliveryDate());
        response.setActualDeliveryDate(
                savedOrder.getActualDeliveryDate());
        response.setItems(responseItems);

        mapDeliveryAddress(savedOrder, response);

        return response;
    }

    // =====================================================
    // MAP DELIVERY ADDRESS TO RESPONSE
    // =====================================================

    private void mapDeliveryAddress(
            Order order,
            OrderResponseDTO response) {

        response.setDeliveryFullName(order.getDeliveryFullName());
        response.setDeliveryEmail(order.getDeliveryEmail());
        response.setDeliveryPhone(order.getDeliveryPhone());
        response.setDeliveryHouseAddress(order.getDeliveryHouseAddress());
        response.setDeliveryArea(order.getDeliveryArea());
        response.setDeliveryLandmark(order.getDeliveryLandmark());
        response.setDeliveryPincode(order.getDeliveryPincode());
        response.setDeliveryCity(order.getDeliveryCity());
        response.setDeliveryState(order.getDeliveryState());
        response.setDeliveryAddressType(order.getDeliveryAddressType());
    }

    // =====================================================
    // COMMON ORDER RESPONSE MAPPER
    // =====================================================

    private OrderResponseDTO toOrderResponse(
            Order order,
            List<OrderItem> orderItems) {

        OrderResponseDTO response = new OrderResponseDTO();

        response.setOrderId(order.getId());
        response.setTotalAmount(order.getTotalAmount());
        response.setStatus(order.getStatus());
        response.setOrderDate(order.getOrderDate());
        response.setExpectedDeliveryDate(
                order.getExpectedDeliveryDate());
        response.setActualDeliveryDate(
                order.getActualDeliveryDate());

        List<OrderItemResponseDTO> items = new ArrayList<>();

        for (OrderItem orderItem : orderItems) {

            OrderItemResponseDTO itemResponse =
                    new OrderItemResponseDTO();

            // Required for customer return/refund requests.
            itemResponse.setOrderItemId(orderItem.getId());

            itemResponse.setProductId(
                    orderItem.getProduct().getId());
            itemResponse.setProductName(
                    orderItem.getProduct().getName());
            itemResponse.setPrice(orderItem.getPrice());
            itemResponse.setQuantity(orderItem.getQuantity());

            items.add(itemResponse);
        }

        response.setItems(items);
        mapDeliveryAddress(order, response);

        return response;
    }

    // =====================================================
    // GET CUSTOMER'S OWN ORDERS
    // =====================================================

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getMyOrders() {

        User user = getAuthenticatedUser();
        List<Order> orders = orderRepository.findByUser(user);

        List<OrderResponseDTO> responses = new ArrayList<>();

        for (Order order : orders) {
            List<OrderItem> orderItems =
                    orderItemRepository.findByOrder(order);

            responses.add(toOrderResponse(order, orderItems));
        }

        return responses;
    }

    // =====================================================
    // GET ALL ORDERS FOR ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getAllOrdersForAdmin() {

        requireAdmin();

        List<Order> allOrders = orderRepository.findAll();
        List<OrderResponseDTO> responses = new ArrayList<>();

        for (Order order : allOrders) {
            List<OrderItem> orderItems =
                    orderItemRepository.findByOrder(order);

            responses.add(toOrderResponse(order, orderItems));
        }

        return responses;
    }

    // =====================================================
    // GET A SINGLE CUSTOMER ORDER
    // =====================================================

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(int orderId) {

        User user = getAuthenticatedUser();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        if (order.getUser() == null
                || !Objects.equals(
                        order.getUser().getId(),
                        user.getId())) {
            throw new OrderAccessDeniedException(
                    "You are not authorized to view this order");
        }

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder(order);

        return toOrderResponse(order, orderItems);
    }

    // =====================================================
    // CANCEL ORDER - CUSTOMER
    // =====================================================

    @Transactional
    public void cancelOrder(int orderId) {

        User user = getAuthenticatedUser();

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        if (order.getUser() == null
                || !Objects.equals(
                        order.getUser().getId(),
                        user.getId())) {
            throw new OrderAccessDeniedException(
                    "You are not authorized to cancel this order");
        }

        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new InvalidOrderStatusException(
                    "This order has already been cancelled");
        }

        Payment payment = paymentRepository.findByOrder(order);

        // Successful payment must use the refund workflow.
        if (payment != null
                && payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new InvalidOrderStatusException(
                    "This order has a successful payment. "
                            + "Cancellation requires the refund workflow.");
        }

        boolean isPendingOrder =
                order.getStatus() == OrderStatus.PENDING;

        boolean isPendingCodOrder =
                order.getStatus() == OrderStatus.CONFIRMED
                && payment != null
                && payment.getPaymentMethod() == PaymentMethod.COD
                && payment.getPaymentStatus() == PaymentStatus.PENDING;

        if (!isPendingOrder && !isPendingCodOrder) {
            throw new InvalidOrderStatusException(
                    "Only pending orders or confirmed COD orders "
                            + "with pending payment can be cancelled");
        }

        List<OrderItem> orderItems = new ArrayList<>(
                orderItemRepository.findByOrder(order));

        // Lock products in ascending order before restoring stock.
        orderItems.sort(
                Comparator.comparing(item -> item.getProduct().getId()));

        for (OrderItem orderItem : orderItems) {

            Integer productId = orderItem.getProduct().getId();

            Product product = productRepository
                    .findByIdForUpdate(productId)
                    .orElseThrow(() -> new ProductNotFoundException(
                            "Product not found with id " + productId));

            product.setStock(
                    product.getStock() + orderItem.getQuantity());

            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELED);
        orderRepository.save(order);
    }

    // =====================================================
    // UPDATE ORDER STATUS - ADMIN
    // =====================================================

    @Transactional
    public void updateOrderStatus(
            int orderId,
            OrderStatus status) {

        requireAdmin();

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + orderId));

        if (status == null) {
            throw new InvalidOrderStatusException(
                    "Order status cannot be null");
        }

        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new InvalidOrderStatusException(
                    "Cancelled orders cannot be updated");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new InvalidOrderStatusException(
                    "Delivered orders cannot be updated");
        }

        // Cancellation must restore stock and follow cancellation rules.
        if (status == OrderStatus.CANCELED) {
            throw new InvalidOrderStatusException(
                    "Use the cancellation workflow to cancel an order");
        }

        // The payment workflow must confirm the order first.
        if (order.getStatus() == OrderStatus.PENDING) {
            throw new InvalidOrderStatusException(
                    "Order must be confirmed through the payment "
                            + "workflow before shipping");
        }

        // CONFIRMED -> SHIPPED
        if (order.getStatus() == OrderStatus.CONFIRMED
                && status != OrderStatus.SHIPPED) {
            throw new InvalidOrderStatusException(
                    "A confirmed order can only be marked as shipped");
        }

        // SHIPPED -> DELIVERED
        if (order.getStatus() == OrderStatus.SHIPPED
                && status != OrderStatus.DELIVERED) {
            throw new InvalidOrderStatusException(
                    "A shipped order can only be marked as delivered");
        }

        if (status == OrderStatus.DELIVERED) {
            order.setActualDeliveryDate(LocalDate.now());
        }

        order.setStatus(status);
        orderRepository.save(order);
    }

    // =====================================================
    // GET ALL RETURN REQUESTS - ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReturnRequestResponseDTO> getAllReturnRequests() {

        requireAdmin();

        List<ReturnRequest> requests =
                returnRequestRepository.findAll();

        List<ReturnRequestResponseDTO> responses = new ArrayList<>();

        for (ReturnRequest request : requests) {

            ReturnRequestResponseDTO response =
                    new ReturnRequestResponseDTO();

            response.setReturnRequestId(request.getId());
            response.setOrderId(request.getOrder().getId());
            response.setOrderItemId(request.getOrderItem().getId());
            response.setProductId(
                    request.getOrderItem().getProduct().getId());
            response.setProductName(
                    request.getOrderItem().getProduct().getName());
            response.setQuantity(request.getQuantity());
            response.setReason(request.getReason());
            response.setReturnStatus(request.getReturnStatus());
            response.setRequestDate(request.getRequestDate());

            responses.add(response);
        }

        return responses;
    }
}