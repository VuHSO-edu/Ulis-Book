package com.ulis.business.controller;

import com.ulis.core.exception.BadRequestException;
import com.ulis.core.http.ResponseBuilder;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/files")
@Tag(name = "FileUploadController", description = "Upload ảnh lên MinIO")
@RequiredArgsConstructor
public class FileUploadController {

    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private final MinioClient minioClient;

    @Value("${MINIO_BUCKET:ulis-books}")
    private String bucket;

    @Value("${MINIO_PUBLIC_URL:/minio}")
    private String publicUrlPrefix;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload ảnh sách lên MinIO (tối đa 10MB)")
    public ResponseEntity<Object> upload(@RequestParam("file") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file ảnh.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Dung lượng ảnh tối đa 10MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP.");
        }

        String ext = switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String objectName = "posts/" + UUID.randomUUID() + ext;

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(contentType)
                        .build()
        );

        String url = publicUrlPrefix.replaceAll("/+$", "") + "/" + bucket + "/" + objectName;
        return ResponseBuilder.ok(Map.of("url", url));
    }
}
