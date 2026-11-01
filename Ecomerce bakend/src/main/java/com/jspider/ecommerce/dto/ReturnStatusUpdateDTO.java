package com.jspider.ecommerce.dto;

import com.jspider.ecommerce.enums.ReturnStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReturnStatusUpdateDTO {

    @NotNull
    private ReturnStatus status;
}