package com.ulis.business.service;

import com.ulis.business.dto.request.BookCreateRequest;
import com.ulis.business.dto.request.BookSearchRequest;
import com.ulis.business.dto.request.BookUpdateRequest;
import com.ulis.business.dto.response.BookPostResponse;
import com.ulis.core.model.response.PageableResponse;

import java.util.List;

/**
 * Bài đăng sách (ticket 04) — CRUD + danh sách riêng + tìm kiếm. Quyền chủ sở
 * hữu được kiểm tra ở service (update/sold/delete chỉ cho chủ bài).
 */
public interface BookPostService {

    BookPostResponse create(Long userId, BookCreateRequest request);

    BookPostResponse update(Long userId, Long postId, BookUpdateRequest request);

    BookPostResponse markSold(Long userId, Long postId);

    void delete(Long userId, Long postId);

    List<BookPostResponse> myPosts(Long userId);

    BookPostResponse detail(Long postId);

    PageableResponse<BookPostResponse> search(BookSearchRequest request);
}
