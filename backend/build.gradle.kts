// Root build for ULIS Books (com.ulis)
// Quy ước vuhso: library prefix `ulis-` (org) · runnable service suffix `-service`.

allprojects {
    group = "com.ulis"
    version = "1.0.0"
}

tasks.register("clean") {
    dependsOn(gradle.includedBuilds.map { it.task(":clean") })
}
