package com.jspider.ecommerce.controler;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.jspider.ecommerce.dto.AddressRequestDTO;
import com.jspider.ecommerce.dto.AddressResponseDTO;
import com.jspider.ecommerce.service.AddressService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponseDTO addAddress(
            @Valid @RequestBody AddressRequestDTO request) {

        return addressService.addAddress(request);
    }

    @GetMapping
    public List<AddressResponseDTO> getMyAddresses() {

        return addressService.getMyAddresses();
    }

    @PutMapping("/{id}")
    public AddressResponseDTO updateAddress(
            @PathVariable Integer id,
            @Valid @RequestBody AddressRequestDTO request) {

        return addressService.updateAddress(id, request);
    }

    @PatchMapping("/{id}/default")
    public AddressResponseDTO setDefaultAddress(
            @PathVariable Integer id) {

        return addressService.setDefaultAddress(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@PathVariable Integer id) {

        addressService.deleteAddress(id);
    }
}