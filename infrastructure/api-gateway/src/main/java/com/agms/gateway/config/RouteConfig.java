package com.agms.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("zone-service", r -> r.path("/api/zones/**").uri("lb://zone-service"))
                .route("sensor-telemetry-service", r -> r.path("/api/sensors/**").uri("lb://sensor-telemetry-service"))
                .route("automation-service", r -> r.path("/api/automation/**").uri("lb://automation-service"))
                .route("crop-inventory-service", r -> r.path("/api/crops/**").uri("lb://crop-inventory-service"))
                .build();
    }
}
