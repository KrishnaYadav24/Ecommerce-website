package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.ReturnRequestDTO;
import com.jspider.ecommerce.dto.ReturnRequestResponseDTO;
import com.jspider.ecommerce.dto.ReturnStatusUpdateDTO;
import com.jspider.ecommerce.service.ReturnRequestService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/returns")
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    // USER - Create return request
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestResponseDTO createReturnRequest(
            @Valid @RequestBody ReturnRequestDTO request) {

        return returnRequestService.createReturnrequest(request);
    }

    // ADMIN - Get all return requests
    @GetMapping("/admin")
    public List<ReturnRequestResponseDTO> getAllReturnRequests() {

        return returnRequestService.getAllReturnRequests();
    }

    // ADMIN - Approve or Reject return request
    @PutMapping("/admin/{returnRequestId}/status")
    public ReturnRequestResponseDTO updateReturnStatus(
            @PathVariable int returnRequestId,
            @Valid @RequestBody ReturnStatusUpdateDTO request) {

        return returnRequestService.updateReturnResponse(
                returnRequestId,
                request.getStatus());
    }
    
    @GetMapping("/my")
    public List<ReturnRequestResponseDTO> getMyReturnRequests() {
        return returnRequestService.getMyReturnRequests();
    }
}