package com.jspider.ecommerce.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jspider.ecommerce.dto.AddressRequestDTO;
import com.jspider.ecommerce.dto.AddressResponseDTO;
import com.jspider.ecommerce.entity.Address;
import com.jspider.ecommerce.entity.User;
import com.jspider.ecommerce.repository.AddressRepository;
import com.jspider.ecommerce.repository.UserRepository;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(
            AddressRepository addressRepository,
            UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first"
            );
        }

        User user = userRepository.findByEmail(authentication.getName());

        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user was not found"
            );
        }

        return user;
    }

    @Transactional
    public AddressResponseDTO addAddress(AddressRequestDTO request) {

        User user = getAuthenticatedUser();

        List<Address> existingAddresses =
                addressRepository.findByUser(user);

        boolean makeDefault =
                existingAddresses.isEmpty()
                || Boolean.TRUE.equals(request.getIsDefault());

        if (makeDefault) {
            for (Address existing : existingAddresses) {
                existing.setIsDefault(false);
            }
            addressRepository.saveAll(existingAddresses);
        }

        Address address = new Address();
        address.setUser(user);

        copyRequestToAddress(request, address);
        address.setIsDefault(makeDefault);

        return toResponseDTO(addressRepository.save(address));
    }

    @Transactional(readOnly = true)
    public List<AddressResponseDTO> getMyAddresses() {

        User user = getAuthenticatedUser();

        return addressRepository.findByUser(user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public AddressResponseDTO updateAddress(
            Integer id,
            AddressRequestDTO request) {

        User user = getAuthenticatedUser();

        List<Address> existingAddresses =
                addressRepository.findByUser(user);

        Address address = findOwnedAddress(id, user);

        boolean makeDefault =
                Boolean.TRUE.equals(request.getIsDefault())
                || Boolean.TRUE.equals(address.getIsDefault());

        if (makeDefault) {
            for (Address existing : existingAddresses) {
                existing.setIsDefault(false);
            }
            addressRepository.saveAll(existingAddresses);
        }

        copyRequestToAddress(request, address);
        address.setUser(user);
        address.setIsDefault(makeDefault);

        return toResponseDTO(addressRepository.save(address));
    }

    @Transactional
    public AddressResponseDTO setDefaultAddress(Integer id) {

        User user = getAuthenticatedUser();

        Address selected = findOwnedAddress(id, user);

        List<Address> addresses = addressRepository.findByUser(user);

        for (Address address : addresses) {
            address.setIsDefault(address.getId().equals(selected.getId()));
        }

        addressRepository.saveAll(addresses);

        return toResponseDTO(selected);
    }

    @Transactional
    public void deleteAddress(Integer id) {

        User user = getAuthenticatedUser();

        Address address = findOwnedAddress(id, user);
        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());

        addressRepository.delete(address);

        if (wasDefault) {
            List<Address> remaining =
                    addressRepository.findByUser(user);

            if (!remaining.isEmpty()) {
                Address replacement = remaining.get(0);
                replacement.setIsDefault(true);
                addressRepository.save(replacement);
            }
        }
    }

    private Address findOwnedAddress(Integer id, User user) {

        return addressRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Address not found for this user"
                ));
    }

    private void copyRequestToAddress(
            AddressRequestDTO request,
            Address address) {

        address.setFullName(request.getFullName());
        address.setEmail(request.getEmail());
        address.setPhone(request.getPhone());
        address.setHouseAddress(request.getHouseAddress());
        address.setArea(request.getArea());
        address.setLandmark(request.getLandmark());
        address.setPincode(request.getPincode());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setAddressType(request.getAddressType());
    }

    private AddressResponseDTO toResponseDTO(Address address) {

        AddressResponseDTO response = new AddressResponseDTO();

        response.setId(address.getId());
        response.setFullName(address.getFullName());
        response.setEmail(address.getEmail());
        response.setPhone(address.getPhone());
        response.setHouseAddress(address.getHouseAddress());
        response.setArea(address.getArea());
        response.setLandmark(address.getLandmark());
        response.setPincode(address.getPincode());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setAddressType(address.getAddressType());
        response.setIsDefault(address.getIsDefault());

        return response;
    }
}