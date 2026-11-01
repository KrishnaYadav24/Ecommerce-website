
package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.InventoryReportDTO;
import com.jspider.ecommerce.service.AdminInventoryReportService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports")
public class AdminInventoryReportController {

    private final AdminInventoryReportService inventoryReportService;

    @GetMapping("/inventory")
    public InventoryReportDTO getInventoryReport() {
        return inventoryReportService.getInventoryReport();
    }
}
