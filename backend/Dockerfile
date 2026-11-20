# Multi-stage build cho Spring Boot business-service
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew gradle.properties lombok.config settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY library ./library
COPY services ./services

RUN chmod +x gradlew && ./gradlew :services:business-service:bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/services/business-service/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
