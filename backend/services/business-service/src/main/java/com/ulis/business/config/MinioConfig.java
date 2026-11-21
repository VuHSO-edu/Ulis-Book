package com.ulis.business.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class MinioConfig {

    @Value("${MINIO_ENDPOINT:http://localhost:9000}")
    private String endpoint;

    @Value("${MINIO_ACCESS_KEY:ulisminio}")
    private String accessKey;

    @Value("${MINIO_SECRET_KEY:ulisminio123}")
    private String secretKey;

    @Value("${MINIO_BUCKET:ulis-books}")
    private String bucket;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Bean
    public ApplicationRunner minioBucketInitializer(MinioClient minioClient) {
        return args -> {
            try {
                boolean exists = minioClient.bucketExists(
                        BucketExistsArgs.builder().bucket(bucket).build());
                if (!exists) {
                    minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                    String policy = """
                            {
                              "Version": "2012-10-17",
                              "Statement": [
                                {
                                  "Effect": "Allow",
                                  "Principal": {"AWS": ["*"]},
                                  "Action": ["s3:GetObject"],
                                  "Resource": ["arn:aws:s3:::%s/*"]
                                }
                              ]
                            }
                            """.formatted(bucket);
                    minioClient.setBucketPolicy(
                            SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
                    log.info("Created MinIO bucket '{}' with public-read policy", bucket);
                }
            } catch (Exception ex) {
                log.warn("MinIO bucket init skipped (MinIO may not be running): {}", ex.getMessage());
            }
        };
    }
}
