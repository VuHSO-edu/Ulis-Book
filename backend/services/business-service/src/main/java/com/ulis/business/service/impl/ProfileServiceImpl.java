package com.ulis.business.service.impl;

import com.ulis.business.dto.request.UpdateProfileRequest;
import com.ulis.business.dto.response.ProfileResponse;
import com.ulis.business.entity.User;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.ProfileService;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * ProfileServiceImpl — mọi field tuỳ chọn lưu null cho chuỗi rỗng; audit
 * updatedAt/updatedBy được set ở đây, không nhận từ client.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final MessageHelper messageHelper;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(findUser(userId));
    }

    @Override
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setFullName(request.getFullName().trim());
        user.setFaculty(trimToNull(request.getFaculty()));
        user.setMajor(trimToNull(request.getMajor()));
        user.setClassName(trimToNull(request.getClassName()));
        user.setPhone(trimToNull(request.getPhone()));
        user.setAvatarUrl(trimToNull(request.getAvatarUrl()));
        user.setUpdatedAt(LocalDateTime.now());
        user.setUpdatedBy(user.getEmail());
        userRepository.save(user);

        log.info("Updated profile for user id={}", userId);
        return ProfileResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
