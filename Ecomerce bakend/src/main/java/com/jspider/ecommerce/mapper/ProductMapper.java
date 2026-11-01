
package com.jspider.ecommerce.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.jspider.ecommerce.dto.ProductRequestDto;
import com.jspider.ecommerce.dto.ProductResponseDTO;
import com.jspider.ecommerce.entity.Product;

@Mapper(componentModel = "spring", uses = CategoryMapper.class)
public interface ProductMapper {

    @Mapping(target = "category", ignore = true)
    Product toEntity(ProductRequestDto request);

    ProductResponseDTO toResponse(Product product);
}
