package com.jspider.ecommerce.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.jspider.ecommerce.enums.OrderStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue
    private Integer id;

    @ManyToOne
    private User user;

    private Double totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime orderDate;

    private LocalDate expectedDeliveryDate;

    private LocalDate actualDeliveryDate;

    // Delivery address snapshot captured when the order is placed.
    @Column(length = 100)
    private String deliveryFullName;

    @Column(length = 150)
    private String deliveryEmail;

    @Column(length = 20)
    private String deliveryPhone;

    @Column(length = 200)
    private String deliveryHouseAddress;

    @Column(length = 150)
    private String deliveryArea;

    @Column(length = 150)
    private String deliveryLandmark;

    @Column(length = 6)
    private String deliveryPincode;

    @Column(length = 100)
    private String deliveryCity;

    @Column(length = 100)
    private String deliveryState;

    @Column(length = 20)
    private String deliveryAddressType;

    @OneToMany(mappedBy = "order")
    private List<OrderItem> items;
}