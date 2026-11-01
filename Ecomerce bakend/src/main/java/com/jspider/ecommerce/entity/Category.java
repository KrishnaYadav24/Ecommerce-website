
package com.jspider.ecommerce.entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

import lombok.Data;

@Data
@Entity
public class Category {

    @Id
    @GeneratedValue
    private int id;

    private String name;

    private String description;

    @OneToMany(
        cascade = CascadeType.REMOVE,
        mappedBy = "category"
    )
    private List<Product> product;
}