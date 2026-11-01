
package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.DeliveryReportDTO;
import com.jspider.ecommerce.dto.SalesReportDTO;
import com.jspider.ecommerce.service.AdminReportService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports")
public class AdminReportController {

	private final AdminReportService adminReportService;

	@GetMapping("/sales")
	public SalesReportDTO getSalesReport() {
		return adminReportService.getSalesReport();
	}

	@GetMapping("/delivery")
	public DeliveryReportDTO getDeliveryReport() {
		return adminReportService.getDeliveryReport();
	}

}
