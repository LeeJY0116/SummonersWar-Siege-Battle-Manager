package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNicknameChangeRequestRepository extends JpaRepository<UserNicknameChangeRequest, Long> {

    boolean existsByUserAndStatus(User user, GuildMemberStatus status);

    boolean existsByRequestedNicknameAndStatus(String requestedNickname, GuildMemberStatus status);

    Optional<UserNicknameChangeRequest> findFirstByUserAndStatusOrderByIdDesc(User user, GuildMemberStatus status);

    List<UserNicknameChangeRequest> findAllByStatusOrderByIdDesc(GuildMemberStatus status);
}
