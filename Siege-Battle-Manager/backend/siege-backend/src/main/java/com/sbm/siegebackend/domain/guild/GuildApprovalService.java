package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildJoinRequestResponse;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserRole;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GuildApprovalService {

    private final GuildMemberRepository guildMemberRepository;
    private final UserService userService;

    public GuildApprovalService(GuildMemberRepository guildMemberRepository,
                                UserService userService) {
        this.guildMemberRepository = guildMemberRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMasterRequests(String loginId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        return guildMemberRepository.findAllByRoleAndStatusAndType(
                        GuildMemberRole.MASTER,
                        GuildMemberStatus.PENDING,
                        GuildMemberType.REAL
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMemberRequests(String loginId) {
        GuildMember actor = getApprovedGuildManager(loginId);

        return guildMemberRepository.findAllByGuildAndStatusAndType(
                        actor.getGuild(),
                        GuildMemberStatus.PENDING,
                        GuildMemberType.REAL
                )
                .stream()
                .filter(member -> member.getRole() == GuildMemberRole.MEMBER)
                .map(this::toResponse)
                .toList();
    }

    public void approveMasterRequest(String loginId, Long memberId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        GuildMember target = getPendingMember(memberId);
        if (target.getRole() != GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("길드장 가입 신청만 승인할 수 있습니다.");
        }

        target.changeStatus(GuildMemberStatus.APPROVED);
    }

    public void rejectMasterRequest(String loginId, Long memberId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        GuildMember target = getPendingMember(memberId);
        if (target.getRole() != GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("길드장 가입 신청만 거절할 수 있습니다.");
        }

        target.changeStatus(GuildMemberStatus.REJECTED);
    }

    public void approveMemberRequest(String loginId, Long memberId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        GuildMember target = getPendingMember(memberId);
        validateSameGuild(actor, target);

        if (target.getRole() != GuildMemberRole.MEMBER) {
            throw new IllegalArgumentException("길드원 가입 신청만 승인할 수 있습니다.");
        }

        target.changeStatus(GuildMemberStatus.APPROVED);
    }

    public void rejectMemberRequest(String loginId, Long memberId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        GuildMember target = getPendingMember(memberId);
        validateSameGuild(actor, target);

        if (target.getRole() != GuildMemberRole.MEMBER) {
            throw new IllegalArgumentException("길드원 가입 신청만 거절할 수 있습니다.");
        }

        target.changeStatus(GuildMemberStatus.REJECTED);
    }

    private GuildMember getApprovedGuildManager(String loginId) {
        User actorUser = userService.findByLoginIdOrThrow(loginId);
        GuildMember actor = guildMemberRepository.findByUser(actorUser)
                .orElseThrow(() -> new NotFoundException("가입된 길드가 없습니다."));

        if (actor.getStatus() != GuildMemberStatus.APPROVED) {
            throw new IllegalStateException("승인된 길드원만 가입 신청을 관리할 수 있습니다.");
        }

        if (actor.getRole() != GuildMemberRole.MASTER && actor.getRole() != GuildMemberRole.SUB_MASTER) {
            throw new IllegalStateException("길드장 또는 부길드장만 가입 신청을 관리할 수 있습니다.");
        }

        return actor;
    }

    private GuildMember getPendingMember(Long memberId) {
        GuildMember target = guildMemberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("가입 신청을 찾을 수 없습니다."));

        if (target.getStatus() != GuildMemberStatus.PENDING || target.getType() != GuildMemberType.REAL) {
            throw new IllegalArgumentException("대기 중인 실제 사용자 가입 신청이 아닙니다.");
        }

        return target;
    }

    private void validateAdmin(User actor) {
        if (actor.getRole() != UserRole.ADMIN) {
            throw new IllegalStateException("관리자만 처리할 수 있습니다.");
        }
    }

    private void validateSameGuild(GuildMember actor, GuildMember target) {
        if (!actor.getGuild().getId().equals(target.getGuild().getId())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }
    }

    private GuildJoinRequestResponse toResponse(GuildMember member) {
        User user = member.getUser();
        return new GuildJoinRequestResponse(
                member.getId(),
                member.getGuild().getId(),
                member.getGuild().getName(),
                user == null ? null : user.getId(),
                user == null ? null : user.getLoginId(),
                user == null ? null : user.getNickname(),
                user == null ? null : user.getEmail(),
                member.getDisplayName(),
                member.getRole(),
                member.getStatus(),
                member.getCreatedAt()
        );
    }
}
