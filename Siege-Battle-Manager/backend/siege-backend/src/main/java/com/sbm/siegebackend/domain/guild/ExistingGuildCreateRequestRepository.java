package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExistingGuildCreateRequestRepository extends JpaRepository<ExistingGuildCreateRequest, Long> {

    boolean existsByUserAndStatus(User user, GuildMemberStatus status);

    boolean existsByGuildNameAndStatus(String guildName, GuildMemberStatus status);

    Optional<ExistingGuildCreateRequest> findFirstByUserAndStatusOrderByIdDesc(
            User user,
            GuildMemberStatus status
    );

    List<ExistingGuildCreateRequest> findAllByStatus(GuildMemberStatus status);
}
