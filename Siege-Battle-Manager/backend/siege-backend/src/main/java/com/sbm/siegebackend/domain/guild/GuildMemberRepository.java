package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public interface GuildMemberRepository extends JpaRepository<GuildMember, Long> {


    // 특정 유저가 어떤 길드든 이미 가입되어 있는지
    boolean existsByUser(User user);

    // 길드 인원 수
    int countByGuild(Guild guild);

    int countByGuildAndStatus(Guild guild, GuildMemberStatus status);

    long countByUser(User user);

    // 길드 내 특정 역할 수 (MASTER / SUB_MASTER / MEMBER)
    int countByGuildAndRole(Guild guild, GuildMemberRole role);

    boolean existsByGuildAndRoleAndStatus(
            Guild guild,
            GuildMemberRole role,
            GuildMemberStatus status
    );

    Optional<GuildMember> findFirstByGuildAndRoleAndStatusOrderByIdDesc(
            Guild guild,
            GuildMemberRole role,
            GuildMemberStatus status
    );

    // 길드의 멤버 목록
    List<GuildMember> findByGuild(Guild guild);

    Optional<GuildMember> findByUser(User user);

    Optional<GuildMember> findFirstByUserOrderByIdDesc(User user);

    Optional<GuildMember> findFirstByUserAndStatusOrderByIdDesc(User user, GuildMemberStatus status);

    List<GuildMember> findAllByGuild(Guild guild);

    @Query("""
            select m
              from GuildMember m
              left join fetch m.user
             where m.guild = :guild
               and m.status = :status
            """)
    List<GuildMember> findAllByGuildAndStatusWithUser(
            @Param("guild") Guild guild,
            @Param("status") GuildMemberStatus status
    );

    List<GuildMember> findAllByUserOrderByIdDesc(User user);

    List<GuildMember> findAllByRoleAndStatusAndType(
            GuildMemberRole role,
            GuildMemberStatus status,
            GuildMemberType type
    );

    List<GuildMember> findAllByGuildAndStatusAndType(
            Guild guild,
            GuildMemberStatus status,
            GuildMemberType type
    );
}

