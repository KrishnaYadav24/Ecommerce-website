package com.jspider.ecommerce.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.jspider.ecommerce.dto.CategoryRequestDto;
import com.jspider.ecommerce.dto.CategoryResponseDto;
import com.jspider.ecommerce.dto.ProductSummaryDTO;
import com.jspider.ecommerce.entity.Category;
import com.jspider.ecommerce.entity.Product;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    Category toEntity(CategoryRequestDto request);

    @Mapping(source = "product", target = "products")
    CategoryResponseDto toResponse(Category category);

    ProductSummaryDTO toProductSummary(Product product);

    List<Category> toEntityList(List<CategoryRequestDto> requests);

    List<CategoryResponseDto> toResponseList(List<Category> categories);

    void updateEntity(CategoryRequestDto request,
                      @MappingTarget Category category);
}