
package com.jspider.ecommerce.controler;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.OrderAnalyticsDTO;
import com.jspider.ecommerce.service.AdminOrderAnalyticsService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports")
public class AdminOrderAnalyticsController {

    private final AdminOrderAnalyticsService orderAnalyticsService;

    @GetMapping("/orders/analytics")
    public OrderAnalyticsDTO getOrderAnalytics() {
        return orderAnalyticsService.getOrderAnalytics();
    }
}
