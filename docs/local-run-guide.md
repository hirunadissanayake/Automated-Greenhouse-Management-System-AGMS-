# AGMS + IoT Local Run Guide

## Prerequisites

1. Java 17
2. Maven 3.9+
3. Node.js 18+ and npm

## Optional Environment Variables

Set these before startup if you want non-default credentials or secret.

```bash
export AGMS_IOT_USERNAME=agms_user
export AGMS_IOT_PASSWORD=123456
export AGMS_IOT_JWT_SECRET='change-this-default-secret-for-dev-only'
export AGMS_IOT_BASE_URL='http://localhost:8080/api'
```

## Start Backend Services (order matters)

Run each command from repository root in a separate terminal.

```bash
mvn -pl infrastructure/service-registry spring-boot:run
mvn -pl infrastructure/config-server spring-boot:run
mvn -pl infrastructure/api-gateway spring-boot:run
mvn -pl services/iot-server-service spring-boot:run
mvn -pl services/zone-service spring-boot:run
mvn -pl services/automation-service spring-boot:run
mvn -pl services/sensor-telemetry-service spring-boot:run
mvn -pl services/crop-inventory-service spring-boot:run
```

## Verify Core Health

```bash
curl http://localhost:8761
curl http://localhost:8080/actuator/health
curl http://localhost:8085/actuator/health
```

## Create Token for Frontend/API

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"agms_user","password":"123456"}'
```

Copy `accessToken` from response.

## Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and set:

1. Gateway URL: `http://localhost:8080`
2. JWT Token: paste the access token

## Quick API Smoke Checks

```bash
TOKEN='<paste-access-token>'

curl -s -X POST http://localhost:8080/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Zone A Sensor","zoneId":"zone-a"}'

curl -s http://localhost:8080/api/devices \
  -H "Authorization: Bearer $TOKEN"

curl -s http://localhost:8080/api/sensors/latest \
  -H "Authorization: Bearer $TOKEN"
```
