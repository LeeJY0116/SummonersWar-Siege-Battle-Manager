package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberBanResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberRoleUpdateRequest;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.ForbiddenException;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import java.util.List;

@Service
@Transactional
public class GuildMemberService {

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final GuildMemberBanRepository guildMemberBanRepository;
    private final UserService userService;

    public GuildMemberService(GuildRepository guildRepository,
                              GuildMemberRepository guildMemberRepository,
                              GuildMemberBanRepository guildMemberBanRepository,
                              UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.guildMemberBanRepository = guildMemberBanRepository;
        this.userService = userService;
    }

    /**
     * 임의 길드원 추가 (Virtual Member)
     */
    public GuildMember addVirtualMember(Long guildId, String email, GuildMemberCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new NotFoundException("존재하지 않는 길드입니다."));

        // 현재 로그인 유저가 이 길드의 MASTER 또는 SUB_MASTER인지 확인
        GuildMember actor = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        if (actor.getGuild().getId() != guildId) {
            throw new IllegalStateException("해당 길드의 멤버가 아니므로 접근할 수 없습니다.");
        }

        if (actor.getRole() == GuildMemberRole.MEMBER) {
            throw new IllegalStateException("길드원은 임의 길드원을 생성할 수 없습니다.");
        }

        // 길드 최대 인원 체크
        int count = guildMemberRepository.countByGuildAndStatus(guild, GuildMemberStatus.APPROVED);
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

        GuildMember actor = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        GuildMember target = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("해당 길드원이 존재하지 않습니다."));

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

    public void changeRealMemberRole(Long guildMemberId, String loginId, GuildMemberRoleUpdateRequest request) {
        GuildMember actor = getActor(loginId);
        validateMaster(actor);

        GuildMember target = getSameGuildTarget(actor, guildMemberId);
        if (target.getType() != GuildMemberType.REAL) {
            throw new IllegalArgumentException("실제 길드원의 등급만 변경할 수 있습니다.");
        }
        if (target.getRole() == GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("길드장 등급은 변경할 수 없습니다.");
        }
        if (actor.getId().equals(target.getId())) {
            throw new IllegalArgumentException("자신의 등급은 변경할 수 없습니다.");
        }

        GuildMemberRole nextRole = request.getRole();
        if (nextRole != GuildMemberRole.MEMBER && nextRole != GuildMemberRole.SUB_MASTER) {
            throw new IllegalArgumentException("길드원 또는 부길드장으로만 변경할 수 있습니다.");
        }

        target.changeRole(nextRole);
    }

    public void kickRealMember(Long guildMemberId, String loginId) {
        GuildMember actor = getActor(loginId);
        validateMaster(actor);

        GuildMember target = getSameGuildTarget(actor, guildMemberId);
        if (target.getType() != GuildMemberType.REAL) {
            throw new IllegalArgumentException("실제 길드원만 추방할 수 있습니다.");
        }
        if (target.getRole() == GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("길드장은 추방할 수 없습니다.");
        }
        if (actor.getId().equals(target.getId())) {
            throw new IllegalArgumentException("자신을 추방할 수 없습니다.");
        }

        if (target.getUser() != null
                && !guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(target.getGuild(), target.getUser())) {
            guildMemberBanRepository.save(GuildMemberBan.create(
                    target.getGuild(),
                    target.getUser(),
                    target.getDisplayName(),
                    actor.getUser(),
                    null
            ));
        }

        target.changeStatus(GuildMemberStatus.LEFT);
    }

    public void transferMaster(Long guildMemberId, String loginId) {
        GuildMember actor = getActor(loginId);
        validateMaster(actor);

        GuildMember target = getSameGuildTarget(actor, guildMemberId);
        if (target.getType() != GuildMemberType.REAL) {
            throw new IllegalArgumentException("실제 길드원에게만 길드장을 양도할 수 있습니다.");
        }
        if (target.getStatus() != GuildMemberStatus.APPROVED) {
            throw new IllegalArgumentException("승인된 길드원에게만 길드장을 양도할 수 있습니다.");
        }
        if (actor.getId().equals(target.getId())) {
            throw new IllegalArgumentException("자신에게 길드장을 양도할 수 없습니다.");
        }
        if (target.getRole() == GuildMemberRole.MASTER) {
            return;
        }

        actor.changeRole(GuildMemberRole.SUB_MASTER);
        target.changeRole(GuildMemberRole.MASTER);
    }

    @Transactional(readOnly = true)
    public List<GuildMemberBanResponse> getActiveBans(String loginId) {
        GuildMember actor = getActor(loginId);
        validateMaster(actor);

        return guildMemberBanRepository.findAllByGuildAndActiveTrue(actor.getGuild()).stream()
                .map(this::toBanResponse)
                .toList();
    }

    public void liftBan(Long banId, String loginId) {
        GuildMember actor = getActor(loginId);
        validateMaster(actor);

        GuildMemberBan ban = guildMemberBanRepository.findById(banId)
                .orElseThrow(() -> new NotFoundException("재가입 차단 기록을 찾을 수 없습니다."));

        if (!actor.getGuild().getId().equals(ban.getGuild().getId())) {
            throw new ForbiddenException("같은 길드의 차단 기록만 해제할 수 있습니다.");
        }

        if (!ban.isActive()) {
            return;
        }

        ban.lift(actor.getUser());
    }

    @Transactional(readOnly = true)
    public List<GuildMemberResponse> getMembersOfMyGuild(String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember me = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        Guild guild = me.getGuild();

        List<GuildMember> members = guildMemberRepository.findByGuild(guild);

        return members.stream()
                .filter(member -> member.getStatus() == GuildMemberStatus.APPROVED)
                .map(this::toResponse)
                .toList();
    }

    private GuildMemberResponse toResponse(GuildMember member) {
        boolean realUser = member.getType() == GuildMemberType.REAL;
        return new GuildMemberResponse(
                member.getId(),
                member.getUser() == null ? null : member.getUser().getId(),
                member.getUser() == null ? null : member.getUser().getLoginId(),
                member.getUser() == null ? null : member.getUser().getEmail(),
                member.getUser() == null ? null : member.getUser().getNickname(),
                member.getDisplayName(),
                member.getRole(),
                member.getType(),
                member.getStatus(),
                realUser
        );
    }

    private GuildMemberBanResponse toBanResponse(GuildMemberBan ban) {
        User bannedBy = ban.getBannedBy();
        return new GuildMemberBanResponse(
                ban.getId(),
                ban.getUser().getId(),
                ban.getLoginIdSnapshot(),
                ban.getNicknameSnapshot(),
                ban.getReason(),
                bannedBy == null ? null : bannedBy.getLoginId(),
                bannedBy == null ? null : bannedBy.getNickname(),
                ban.getCreatedAt()
        );
    }

    private GuildMember getActor(String loginId) {
        User user = userService.findByLoginIdOrThrow(loginId);
        GuildMember actor = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("가입된 길드가 없습니다."));

        if (actor.getStatus() != GuildMemberStatus.APPROVED) {
            throw new ForbiddenException("승인된 길드원만 처리할 수 있습니다.");
        }

        return actor;
    }

    private void validateMaster(GuildMember actor) {
        if (actor.getRole() != GuildMemberRole.MASTER) {
            throw new ForbiddenException("길드장만 처리할 수 있습니다.");
        }
    }

    private GuildMember getSameGuildTarget(GuildMember actor, Long guildMemberId) {
        GuildMember target = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("길드원을 찾을 수 없습니다."));

        if (!actor.getGuild().getId().equals(target.getGuild().getId())) {
            throw new ForbiddenException("같은 길드의 길드원만 처리할 수 있습니다.");
        }

        return target;
    }
}
