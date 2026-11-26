package com.ulis.business.repository;

import com.ulis.business.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    List<Invoice> findBySellerIdOrBuyerIdOrderByCreatedAtDesc(Long sellerId, Long buyerId);

    List<Invoice> findAllByOrderByCreatedAtDesc();
}
