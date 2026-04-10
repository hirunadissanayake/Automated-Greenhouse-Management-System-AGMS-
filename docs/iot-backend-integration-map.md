# IoT Backend to AGMS Integration Map

## Service Mapping

| IoT Backend Capability | AGMS Target Service | Integration Type |
|---|---|---|
| `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` | `iot-server-service` | Native implementation in AGMS |
| `/api/devices` (create/list) | `iot-server-service` | Native implementation in AGMS |
| `/api/devices/telemetry/{deviceId}` | `iot-server-service` | Native implementation in AGMS |
| Device provisioning when zone is created | `zone-service` -> `iot-server-service` | HTTP via gateway (`/api/devices`) |
| Periodic telemetry polling | `sensor-telemetry-service` -> `iot-server-service` | Scheduled HTTP polling |
| Telemetry to rule engine | `sensor-telemetry-service` -> `automation-service` | Existing internal HTTP call |
| External access | `api-gateway` | Route forwarding via Eureka LB |

## Integration Points Added

1. Maven module registration:
   - `services/iot-server-service` added to parent modules.
2. Gateway routing:
   - `/api/auth/**` -> `lb://iot-server-service`
   - `/api/devices/**` -> `lb://iot-server-service`
3. Centralized config:
   - Added `config-repo/iot-server-service.yml`.
   - Replaced remote IP IoT references with environment-driven local gateway base URL in `zone-service` and `sensor-telemetry-service` configs.
4. Runtime contract alignment:
   - Kept endpoint and payload shape compatible with existing zone/sensor client expectations.
5. Reliability improvement:
   - Sensor polling now retries login when IoT token is expired (401) and retries the request once.

## Data Flow

1. User authenticates through gateway on `/api/auth/login`.
2. `zone-service` creates a zone and provisions an IoT device via `/api/devices`.
3. `sensor-telemetry-service` logs in and polls `/api/devices` + `/api/devices/telemetry/{id}` every 10s.
4. Telemetry is forwarded to `automation-service` at `/api/automation/process`.
5. Frontend reads latest telemetry from `sensor-telemetry-service` on `/api/sensors/latest`.
