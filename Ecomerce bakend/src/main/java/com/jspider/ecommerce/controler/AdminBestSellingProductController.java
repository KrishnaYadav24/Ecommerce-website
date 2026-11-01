
package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.BestSellingProductDTO;
import com.jspider.ecommerce.service.AdminBestSellingProductService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/admin/reports")
public class AdminBestSellingProductController {

    private final AdminBestSellingProductService bestSellingProductService;

    @GetMapping("/best-selling-products")
    public List<BestSellingProductDTO> getBestSellingProducts() {
        return bestSellingProductService.getBestSellingProducts();
    }
}
