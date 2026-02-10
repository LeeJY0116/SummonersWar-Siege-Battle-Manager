package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public interface GuildMemberRepository extends JpaRepository<GuildMember, Long> {

    // 특정 유저가 어떤 길드든 이미 가입되어 있는지
    boolean existsByUser(User user);

    // 길드 인원 수
    int countByGuild(Guild guild);

    // 길드 내 특정 역할 수 (MASTER / SUB_MASTER / MEMBER)
    int countByGuildAndRole(Guild guild, GuildMemberRole role);

    // 길드의 멤버 목록
    List<GuildMember> findByGuild(Guild guild);

    Optional<GuildMember> findByUser(User user);

    List<GuildMember> findAllByGuild(Guild guild);
}

