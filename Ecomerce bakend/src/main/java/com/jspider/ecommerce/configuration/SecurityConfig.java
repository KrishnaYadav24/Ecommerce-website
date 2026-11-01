package com.jspider.ecommerce.configuration;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.jspider.ecommerce.service.CustomerUserDetailService;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Configuration
public class SecurityConfig {

    private final CustomerUserDetailService customerDetail;
    private final JWTAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    SecurityFilterChain securityfilterchain(
            HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            )

            .userDetailsService(customerDetail)

            .authorizeHttpRequests(auth -> auth

                // =========================================
                // CORS PREFLIGHT REQUESTS
                // =========================================

                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // =========================================
                // PUBLIC AUTHENTICATION AND DOCUMENTATION
                // =========================================

                .requestMatchers(
                    "/registeruser",
                    "/login",
                    "/swagger-ui/**",
                    "/v3/api-docs/**"
                ).permitAll()

                // =========================================
                // PUBLIC PRODUCT BROWSING
                // =========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/displayproduct",
                    "/displayproductbyid/**",
                    "/pagination",
                    "/searching",
                    "/advanced-filtering"
                ).permitAll()

                // =========================================
                // PUBLIC CATEGORY BROWSING
                // =========================================

                .requestMatchers(
                    HttpMethod.GET,
                    "/displaycategory",
                    "/page"
                ).permitAll()

                // =========================================
                // ADMIN-ONLY APIs
                // =========================================

                .requestMatchers(
                    "/admin/**"
                ).hasRole("ADMIN")

                .requestMatchers(
                    "/returns/admin/**"
                ).hasRole("ADMIN")

                // Admin product/category creation
                .requestMatchers(
                    HttpMethod.POST,
                    "/products",
                    "/addcategory",
                    "/addmultiplecategory"
                ).hasRole("ADMIN")

                // Admin product/category updates
                .requestMatchers(
                    HttpMethod.PUT,
                    "/updateproductbyid/**",
                    "/updatecategory/**"
                ).hasRole("ADMIN")

                // Admin product/category deletion
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/deletemapping/**",
                    "/deletecategory/**"
                ).hasRole("ADMIN")

                // =========================================
                // CUSTOMER RETURN REQUESTS
                // =========================================

                // Customer views their own return requests.
                .requestMatchers(
                    HttpMethod.GET,
                    "/returns/my"
                ).hasAnyRole("USER", "ADMIN")

                // Customer submits a return request.
                .requestMatchers(
                    HttpMethod.POST,
                    "/returns"
                ).hasAnyRole("USER", "ADMIN")

                // =========================================
                // REFUND APIs
                // =========================================

                // Create refund for an eligible return request.
                .requestMatchers(
                    HttpMethod.POST,
                    "/refunds/return/**"
                ).hasAnyRole("USER", "ADMIN")

                // Other refund APIs are admin-only.
                .requestMatchers(
                    "/refunds/**"
                ).hasRole("ADMIN")

                // =========================================
                // USER APIs
                // =========================================

                .requestMatchers(
                    "/user/**"
                ).hasAnyRole("USER", "ADMIN")

                // =========================================
                // ALL OTHER ENDPOINTS
                // =========================================

                .anyRequest().authenticated()
            );

        return http.build();
    }

    // =========================================
    // CORS CONFIGURATION
    // =========================================

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
            Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            List.of("*")
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }

    // =========================================
    // PASSWORD ENCODER
    // =========================================

    @Bean
    PasswordEncoder encoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================================
    // AUTHENTICATION MANAGER
    // =========================================

    @Bean
    AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }
}