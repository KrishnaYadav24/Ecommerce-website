package com.jspider.ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jspider.ecommerce.entity.Address;
import com.jspider.ecommerce.entity.User;

public interface AddressRepository
        extends JpaRepository<Address, Integer> {

    List<Address> findByUser(User user);

    Optional<Address> findByIdAndUser(Integer id, User user);
}