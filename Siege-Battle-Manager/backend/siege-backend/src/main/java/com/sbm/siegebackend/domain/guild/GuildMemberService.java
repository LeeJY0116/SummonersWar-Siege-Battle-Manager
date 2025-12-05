package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberCreateRequest;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class GuildMemberService {

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final UserService userService;

    public GuildMemberService(GuildRepository guildRepository,
                              GuildMemberRepository guildMemberRepository,
                              UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.userService = userService;
    }

    /**
     * 임의 길드원 추가 (Virtual Member)
     */
    public GuildMember addVirtualMember(Long guildId, String email, GuildMemberCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 길드입니다."));

        // 현재 로그인 유저가 이 길드의 MASTER 또는 SUB_MASTER인지 확인
        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("길드에 가입되지 않은 유저입니다."));

        if (actor.getGuild().getId() != guildId) {
            throw new IllegalStateException("해당 길드의 멤버가 아니므로 접근할 수 없습니다.");
        }

        if (actor.getRole() == GuildMemberRole.MEMBER) {
            throw new IllegalStateException("길드원은 임의 길드원을 생성할 수 없습니다.");
        }

        // 길드 최대 인원 체크
        int count = guildMemberRepository.countByGuild(guild);
        if (count >= 35) {
            throw new IllegalStateException("길드 최대 인원(35명)을 초과할 수 없습니다.");
        }

        // 가짜 길드원 생성
        GuildMember virtual = GuildMember.createVirtual(
                guild,
                request.getDisplayName(),
                GuildMemberRole.MEMBER
        );

        return guildMemberRepository.save(virtual);
    }

    /**
     * 임의 길드원 삭제 (Virtual Member)
     */
    public void deleteVirtualMember(Long guildMemberId, String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("길드에 가입되지 않은 유저입니다."));

        GuildMember target = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new IllegalArgumentException("해당 길드원이 존재하지 않습니다."));

        // 자기 길드인지 확인
        if (!actor.getGuild().getId().equals(target.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 멤버는 삭제할 수 없습니다.");
        }

        // 권한 확인
        if (actor.getRole() == GuildMemberRole.MEMBER) {
            throw new IllegalStateException("길드원은 임의 길드원을 삭제할 수 없습니다.");
        }

        // REAL 멤버 삭제는 불가
        if (target.getType() == GuildMemberType.REAL) {
            throw new IllegalStateException("실제 길드원은 이 API로 삭제할 수 없습니다.");
        }

        guildMemberRepository.delete(target);
    }
}
