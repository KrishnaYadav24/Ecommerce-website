
package com.jspider.ecommerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jspider.ecommerce.entity.ReturnRequest;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.enums.ReturnStatus;

public interface ReturnRequestRepository
        extends JpaRepository<ReturnRequest, Integer> {

    List<ReturnRequest> findByUser(User user);

    long countByReturnStatus(ReturnStatus returnStatus);
}
