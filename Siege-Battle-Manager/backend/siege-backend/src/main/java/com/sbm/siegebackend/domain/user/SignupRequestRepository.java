package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SignupRequestRepository extends JpaRepository<SignupRequest, Long> {

    boolean existsByLoginIdAndStatus(String loginId, GuildMemberStatus status);

    boolean existsByEmailAndStatus(String email, GuildMemberStatus status);

    boolean existsByNicknameAndStatus(String nickname, GuildMemberStatus status);

    boolean existsBySignupTypeAndGuildNameAndStatus(
            String signupType,
            String guildName,
            GuildMemberStatus status
    );

    Optional<SignupRequest> findFirstByLoginIdAndStatus(String loginId, GuildMemberStatus status);

    Optional<SignupRequest> findFirstByEmailAndStatus(String email, GuildMemberStatus status);

    Optional<SignupRequest> findFirstByNicknameAndStatus(String nickname, GuildMemberStatus status);

    List<SignupRequest> findAllBySignupTypeAndStatus(String signupType, GuildMemberStatus status);

    List<SignupRequest> findAllBySignupTypeAndGuildNameAndStatus(
            String signupType,
            String guildName,
            GuildMemberStatus status
    );
}
