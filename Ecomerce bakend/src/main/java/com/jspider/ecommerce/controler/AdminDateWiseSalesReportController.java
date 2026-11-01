
package com.jspider.ecommerce.controler;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.DateWiseSalesReportDTO;
import com.jspider.ecommerce.service.AdminDateWiseSalesReportService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports/sales")
public class AdminDateWiseSalesReportController {

    private final AdminDateWiseSalesReportService salesReportService;

    @GetMapping("/date-range")
    public DateWiseSalesReportDTO getSalesReport(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate) {

        return salesReportService.getSalesReport(startDate, endDate);
    }
}
