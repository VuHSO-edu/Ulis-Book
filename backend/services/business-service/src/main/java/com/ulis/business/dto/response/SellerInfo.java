package com.ulis.business.dto.response;

import com.ulis.business.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Thông tin người bán nhúng trong bài đăng — khớp BookPostItem.seller bên FE.
 * Domain chưa có mã sinh viên (MSV) nên msv trả chuỗi rỗng; cohort lấy từ năm
 * đăng bài (QH-{year} · ULIS); avatar được sinh từ họ tên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerInfo {

    private Long id;

    private String msv;

    private String fullName;

    private String email;

    private String faculty;

    private String cohort;

    private String phone;

    private String avatarInitials;

    private String avatarBg;

    /** Bảng màu nền avatar pastel — cùng tông mock-data FE. */
    static final List<String> AVATAR_BG = List.of(
            "#dbe1ff", "#ffddb8", "#d3f3d3", "#ffe0ec", "#d9f0ff", "#f5e6ff", "#fff3cc", "#cfe8ff");

    public static SellerInfo from(User user, LocalDateTime postCreatedAt) {
        String fullName = user.getFullName();
        int year = postCreatedAt == null ? LocalDateTime.now().getYear() : postCreatedAt.getYear();
        return SellerInfo.builder()
                .id(user.getId())
                .msv("")
                .fullName(fullName)
                .email(user.getEmail())
                .faculty(user.getFaculty() == null ? "" : user.getFaculty())
                .cohort("QH-" + year + " · ULIS")
                .phone(user.getPhone() == null ? "" : user.getPhone())
                .avatarInitials(initials(fullName))
                .avatarBg(AVATAR_BG.get(Math.floorMod(safeHash(fullName), AVATAR_BG.size())))
                .build();
    }

    /** "Nguyễn Văn An" -> "NA"; 1 từ -> 2 ký tự đầu. */
    private static String initials(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "?";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            String p = parts[0];
            return p.length() >= 2 ? p.substring(0, 2).toUpperCase() : p.toUpperCase();
        }
        return (String.valueOf(Character.toUpperCase(parts[0].charAt(0)))
                + Character.toUpperCase(parts[parts.length - 1].charAt(0)));
    }

    private static int safeHash(String value) {
        return value == null ? 0 : value.hashCode();
    }
}
