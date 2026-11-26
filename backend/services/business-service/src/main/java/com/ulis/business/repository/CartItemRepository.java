package com.ulis.business.repository;

import com.ulis.business.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<CartItem> findByUserIdAndBookPostId(Long userId, Long bookPostId);

    void deleteByUserIdAndBookPostIdIn(Long userId, List<Long> bookPostIds);
}
