package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExistingGuildJoinRequestRepository extends JpaRepository<ExistingGuildJoinRequest, Long> {

    boolean existsByUserAndStatus(User user, GuildMemberStatus status);

    Optional<ExistingGuildJoinRequest> findFirstByUserAndStatusOrderByIdDesc(User user, GuildMemberStatus status);

    List<ExistingGuildJoinRequest> findAllByGuildAndStatus(Guild guild, GuildMemberStatus status);
}
