plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.ulis"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

springBoot {
    mainClass.set("com.ulis.business.BusinessServiceApplication")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.release.set(17)
}

dependencies {
    // --- Internal modules ---
    implementation(project(":library:ulis-core"))

    // --- Spring Boot ---
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // --- JWT (jjwt: api + runtime impl/jackson) ---
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // --- API docs ---
    implementation(libs.springdoc.openapi)

    // --- Annotation processors ---
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly("org.springframework.boot:spring-boot-configuration-processor")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // --- Database (runtime) ---
    runtimeOnly("com.h2database:h2")          // dev + test (PostgreSQL mode)
    runtimeOnly("org.postgresql:postgresql") // prod

    // --- Test dependencies ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:3.2.5")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
