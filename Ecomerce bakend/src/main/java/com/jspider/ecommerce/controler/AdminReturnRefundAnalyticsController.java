
package com.jspider.ecommerce.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.ReturnRefundAnalyticsDTO;
import com.jspider.ecommerce.service.AdminReturnRefundAnalyticsService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports")
public class AdminReturnRefundAnalyticsController {

    private final AdminReturnRefundAnalyticsService analyticsService;

    @GetMapping("/returns-refunds")
    public ReturnRefundAnalyticsDTO getAnalytics() {
        return analyticsService.getAnalytics();
    }
}
