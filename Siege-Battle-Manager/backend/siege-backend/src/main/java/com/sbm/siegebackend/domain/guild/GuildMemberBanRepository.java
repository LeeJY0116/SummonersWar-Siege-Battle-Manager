package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuildMemberBanRepository extends JpaRepository<GuildMemberBan, Long> {

    boolean existsByGuildAndUserAndActiveTrue(Guild guild, User user);

    Optional<GuildMemberBan> findByGuildAndUserAndActiveTrue(Guild guild, User user);

    List<GuildMemberBan> findAllByGuildAndActiveTrue(Guild guild);
}
