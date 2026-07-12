package com.sbm.siegebackend.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNicknameHistoryRepository extends JpaRepository<UserNicknameHistory, Long> {

    boolean existsByUser(User user);

    List<UserNicknameHistory> findAllByUserOrderByIdDesc(User user);
}
