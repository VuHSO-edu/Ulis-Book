package com.ulis.business.repository;

import com.ulis.business.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository người dùng — derived methods đơn giản, theo vuhso-java-backend-rules §5.6.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByMsvIgnoreCase(String msv);

    boolean existsByEmailIgnoreCase(String email);
}
