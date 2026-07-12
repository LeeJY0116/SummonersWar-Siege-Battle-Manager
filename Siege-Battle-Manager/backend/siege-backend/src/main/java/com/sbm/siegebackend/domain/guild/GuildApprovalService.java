package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildJoinRequestResponse;
import com.sbm.siegebackend.domain.user.SignupRequest;
import com.sbm.siegebackend.domain.user.SignupRequestRepository;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserRepository;
import com.sbm.siegebackend.domain.user.UserRole;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GuildApprovalService {

    private static final String MASTER_SIGNUP = "master";
    private static final String MEMBER_SIGNUP = "member";

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public GuildApprovalService(GuildRepository guildRepository,
                                GuildMemberRepository guildMemberRepository,
                                SignupRequestRepository signupRequestRepository,
                                UserRepository userRepository,
                                UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.signupRequestRepository = signupRequestRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMasterRequests(String loginId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        return signupRequestRepository.findAllBySignupTypeAndStatus(
                        MASTER_SIGNUP,
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMemberRequests(String loginId) {
        GuildMember actor = getApprovedGuildManager(loginId);

        return signupRequestRepository.findAllBySignupTypeAndGuildNameAndStatus(
                        MEMBER_SIGNUP,
                        actor.getGuild().getName(),
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void approveMasterRequest(String loginId, Long requestId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        SignupRequest request = getPendingRequest(requestId, MASTER_SIGNUP);
        validateUserCanBeCreated(request);

        User user = createUser(request);
        Guild guild = guildRepository.save(new Guild(request.getGuildName(), "", user));
        GuildMember member = GuildMember.createReal(
                guild,
                user,
                GuildMemberRole.MASTER,
                GuildMemberStatus.APPROVED
        );
        guildMemberRepository.save(member);
        guild.addMember(member);
        request.changeStatus(GuildMemberStatus.APPROVED);
    }

    public void rejectMasterRequest(String loginId, Long requestId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        SignupRequest request = getPendingRequest(requestId, MASTER_SIGNUP);
        request.changeStatus(GuildMemberStatus.REJECTED);
    }

    public void approveMemberRequest(String loginId, Long requestId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        SignupRequest request = getPendingRequest(requestId, MEMBER_SIGNUP);

        if (!actor.getGuild().getName().equals(request.getGuildName())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }

        validateUserCanBeCreated(request);

        User user = createUser(request);
        GuildMember member = GuildMember.createReal(
                actor.getGuild(),
                user,
                GuildMemberRole.MEMBER,
                GuildMemberStatus.APPROVED
        );
        guildMemberRepository.save(member);
        actor.getGuild().addMember(member);
        request.changeStatus(GuildMemberStatus.APPROVED);
    }

    public void rejectMemberRequest(String loginId, Long requestId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        SignupRequest request = getPendingRequest(requestId, MEMBER_SIGNUP);

        if (!actor.getGuild().getName().equals(request.getGuildName())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }

        request.changeStatus(GuildMemberStatus.REJECTED);
    }

    private User createUser(SignupRequest request) {
        return userRepository.save(User.create(
                request.getLoginId(),
                request.getEmail(),
                request.getPasswordHash(),
                request.getNickname(),
                UserRole.USER
        ));
    }

    private void validateUserCanBeCreated(SignupRequest request) {
        if (userRepository.existsByLoginId(request.getLoginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
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

    private SignupRequest getPendingRequest(Long requestId, String signupType) {
        SignupRequest request = signupRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("가입 신청을 찾을 수 없습니다."));

        if (request.getStatus() != GuildMemberStatus.PENDING
                || !signupType.equalsIgnoreCase(request.getSignupType())) {
            throw new IllegalArgumentException("대기 중인 가입 신청이 아닙니다.");
        }

        return request;
    }

    private void validateAdmin(User actor) {
        if (actor.getRole() != UserRole.ADMIN) {
            throw new IllegalStateException("관리자만 처리할 수 있습니다.");
        }
    }

    private GuildJoinRequestResponse toResponse(SignupRequest request) {
        Guild guild = guildRepository.findByName(request.getGuildName()).orElse(null);
        GuildMemberRole role = MASTER_SIGNUP.equalsIgnoreCase(request.getSignupType())
                ? GuildMemberRole.MASTER
                : GuildMemberRole.MEMBER;

        return new GuildJoinRequestResponse(
                request.getId(),
                guild == null ? null : guild.getId(),
                request.getGuildName(),
                null,
                request.getLoginId(),
                request.getNickname(),
                request.getEmail(),
                request.getNickname(),
                role,
                request.getStatus(),
                request.getCreatedAt()
        );
    }
}
