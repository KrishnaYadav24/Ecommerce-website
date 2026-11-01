package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.RefundResponseDTO;
import com.jspider.ecommerce.service.RefundService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/refunds")
public class RefundController {

	private final RefundService refundService;

	// Create refund for approved return
	@PostMapping("/return/{returnRequestId}")
	public RefundResponseDTO createRefund(@PathVariable int returnRequestId) {

		return refundService.createRefund(returnRequestId);
	}

	// Start refund processing
	@PostMapping("/{refundId}/process")
	public RefundResponseDTO processRefund(@PathVariable int refundId) {

		return refundService.processRefund(refundId);
	}

	// Complete refund
	@PostMapping("/{refundId}/complete")
	public RefundResponseDTO completeRefund(@PathVariable int refundId) {

		return refundService.completeRefund(refundId);
	}

	// ADMIN - Get all refunds
	@GetMapping("/admin")
	public List<RefundResponseDTO> getAllRefunds() {
		return refundService.getAllRefunds();
	}
}