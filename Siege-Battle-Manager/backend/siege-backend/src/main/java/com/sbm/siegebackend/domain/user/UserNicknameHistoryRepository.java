package com.sbm.siegebackend.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNicknameHistoryRepository extends JpaRepository<UserNicknameHistory, Long> {

    boolean existsByUser(User user);

    long countByUserAndChangeTypeNot(User user, String changeType);

    List<UserNicknameHistory> findAllByUserOrderByIdDesc(User user);
}
