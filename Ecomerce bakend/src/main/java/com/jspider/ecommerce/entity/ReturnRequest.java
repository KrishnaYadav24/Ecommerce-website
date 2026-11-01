
package com.jspider.ecommerce.entity;

import java.time.LocalDateTime;

import com.jspider.ecommerce.enums.ReturnStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Order order;

    @ManyToOne
    private OrderItem orderItem;

    private Integer quantity;

    private String reason;

    @Enumerated(EnumType.STRING)
    private ReturnStatus returnStatus;

    private LocalDateTime requestDate;
}
