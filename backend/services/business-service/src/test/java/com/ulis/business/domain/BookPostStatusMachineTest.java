package com.ulis.business.domain;

import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.enums.BookPostStatusTrigger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.ulis.business.enums.BookPostStatus.BANNED;
import static com.ulis.business.enums.BookPostStatus.EXPIRED;
import static com.ulis.business.enums.BookPostStatus.HIDDEN;
import static com.ulis.business.enums.BookPostStatus.SELLING;
import static com.ulis.business.enums.BookPostStatus.SOLD;
import static com.ulis.business.enums.BookPostStatusTrigger.BAN;
import static com.ulis.business.enums.BookPostStatusTrigger.CREATE;
import static com.ulis.business.enums.BookPostStatusTrigger.DELETE;
import static com.ulis.business.enums.BookPostStatusTrigger.EXPIRE;
import static com.ulis.business.enums.BookPostStatusTrigger.MARK_SOLD;
import static com.ulis.business.enums.BookPostStatusTrigger.UPDATE;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit test state machine bài đăng (ticket 05) — bảo vệ mọi transition hợp lệ:
 * số lượng về 0 tự SOLD, job hết hạn, khoá BANNED, nhân đôi hành động.
 */
class BookPostStatusMachineTest {

    @Test
    @DisplayName("CREATE: quantity > 0 -> SELLING, quantity = 0 -> SOLD (auto); cấm tạo ở trạng thái khác")
    void createAllowsSellingAndSold() {
        assertTrue(BookPostStatusMachine.isAllowed(null, SELLING, CREATE));
        assertTrue(BookPostStatusMachine.isAllowed(null, SOLD, CREATE));
        assertFalse(BookPostStatusMachine.isAllowed(null, HIDDEN, CREATE));
        assertFalse(BookPostStatusMachine.isAllowed(null, EXPIRED, CREATE));
        assertFalse(BookPostStatusMachine.isAllowed(null, BANNED, CREATE));
    }

    @Test
    @DisplayName("UPDATE: relist/thay đổi số lượng; quantity về 0 -> SOLD; BANNED bị khoá")
    void updateAllowsSellingSoldButNotBanned() {
        assertTrue(BookPostStatusMachine.isAllowed(SELLING, SELLING, UPDATE));
        assertTrue(BookPostStatusMachine.isAllowed(SELLING, SOLD, UPDATE));   // hết hàng
        assertTrue(BookPostStatusMachine.isAllowed(SOLD, SELLING, UPDATE));    // đăng lại
        assertTrue(BookPostStatusMachine.isAllowed(HIDDEN, SELLING, UPDATE));  // khôi phục sau ẩn
        assertTrue(BookPostStatusMachine.isAllowed(EXPIRED, SELLING, UPDATE)); // đăng lại sau hết hạn
        assertTrue(BookPostStatusMachine.isAllowed(EXPIRED, SOLD, UPDATE));
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, EXPIRED, UPDATE));
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, HIDDEN, UPDATE));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, SELLING, UPDATE));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, SOLD, UPDATE));
    }

    @Test
    @DisplayName("MARK_SOLD: chỉ SELLING -> SOLD; không nhân đôi / không trên hết hạn / ẩn / khoá")
    void markSoldAllowedOnlyFromSelling() {
        assertTrue(BookPostStatusMachine.isAllowed(SELLING, SOLD, MARK_SOLD));
        assertFalse(BookPostStatusMachine.isAllowed(SOLD, SOLD, MARK_SOLD));
        assertFalse(BookPostStatusMachine.isAllowed(EXPIRED, SOLD, MARK_SOLD));
        assertFalse(BookPostStatusMachine.isAllowed(HIDDEN, SOLD, MARK_SOLD));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, SOLD, MARK_SOLD));
    }

    @Test
    @DisplayName("DELETE (xoá mềm): SELLING/SOLD/HIDDEN/EXPIRED -> HIDDEN; BANNED bị khoá")
    void deleteAllowsActiveAndFinishedButNotBanned() {
        assertTrue(BookPostStatusMachine.isAllowed(SELLING, HIDDEN, DELETE));
        assertTrue(BookPostStatusMachine.isAllowed(SOLD, HIDDEN, DELETE));
        assertTrue(BookPostStatusMachine.isAllowed(HIDDEN, HIDDEN, DELETE));   // idempotent
        assertTrue(BookPostStatusMachine.isAllowed(EXPIRED, HIDDEN, DELETE));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, HIDDEN, DELETE));
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, SELLING, DELETE));
    }

    @Test
    @DisplayName("EXPIRE (job): chỉ SELLING quá hạn -> EXPIRED; không ảnh hưởng trạng thái khác")
    void expireAllowedOnlyFromSelling() {
        assertTrue(BookPostStatusMachine.isAllowed(SELLING, EXPIRED, EXPIRE));
        assertFalse(BookPostStatusMachine.isAllowed(SOLD, EXPIRED, EXPIRE));
        assertFalse(BookPostStatusMachine.isAllowed(HIDDEN, EXPIRED, EXPIRE));
        assertFalse(BookPostStatusMachine.isAllowed(EXPIRED, EXPIRED, EXPIRE));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, EXPIRED, EXPIRE));
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, SOLD, EXPIRE));
    }

    @Test
    @DisplayName("BAN (admin): bất kỳ trạng thái -> BANNED; còn những đích khác thì bị cấm")
    void banReachesBannedFromAnyState() {
        for (BookPostStatus from : BookPostStatus.values()) {
            assertTrue(BookPostStatusMachine.isAllowed(from, BANNED, BAN), "ban from " + from);
        }
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, HIDDEN, BAN));
        assertFalse(BookPostStatusMachine.isAllowed(SELLING, SELLING, BAN));
        assertFalse(BookPostStatusMachine.isAllowed(BANNED, SELLING, BAN));
    }
}
