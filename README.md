# Automated Greenhouse Management System (AGMS)

AGMS is a microservice-based application built with Spring Boot and Spring Cloud.

## Services

### Infrastructure
- `service-registry` (Eureka): `8761`
- `config-server` (Cloud Config): `8888`
- `api-gateway` (Spring Cloud Gateway): `8080`

### Domain
- `zone-service`: `8081`
- `sensor-telemetry-service`: `8082`
- `automation-service`: `8083`
- `crop-inventory-service`: `8084`

## Startup Order
1. Start `service-registry`.
2. Start `config-server`.
3. Start `api-gateway`.
4. Start all domain services.

## Status
Initial architecture scaffold completed.
