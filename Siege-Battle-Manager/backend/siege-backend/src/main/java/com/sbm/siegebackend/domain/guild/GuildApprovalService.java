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
import java.util.stream.Stream;

@Service
@Transactional
public class GuildApprovalService {

    private static final String MASTER_SIGNUP = "master";
    private static final String MEMBER_SIGNUP = "member";
    private static final String REQUEST_SOURCE_SIGNUP = "SIGNUP";
    private static final String REQUEST_SOURCE_ACCOUNT = "ACCOUNT";
    private static final String REQUEST_SOURCE_ACCOUNT_MASTER = "ACCOUNT_MASTER";
    private static final int MAX_GUILD_MEMBER_COUNT = 35;

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final GuildMemberBanRepository guildMemberBanRepository;
    private final ExistingGuildJoinRequestRepository existingGuildJoinRequestRepository;
    private final ExistingGuildCreateRequestRepository existingGuildCreateRequestRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public GuildApprovalService(GuildRepository guildRepository,
                                GuildMemberRepository guildMemberRepository,
                                GuildMemberBanRepository guildMemberBanRepository,
                                ExistingGuildJoinRequestRepository existingGuildJoinRequestRepository,
                                ExistingGuildCreateRequestRepository existingGuildCreateRequestRepository,
                                SignupRequestRepository signupRequestRepository,
                                UserRepository userRepository,
                                UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.guildMemberBanRepository = guildMemberBanRepository;
        this.existingGuildJoinRequestRepository = existingGuildJoinRequestRepository;
        this.existingGuildCreateRequestRepository = existingGuildCreateRequestRepository;
        this.signupRequestRepository = signupRequestRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMasterRequests(String loginId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        List<GuildJoinRequestResponse> signupRequests = signupRequestRepository.findAllBySignupTypeAndStatus(
                        MASTER_SIGNUP,
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();

        List<GuildJoinRequestResponse> accountRequests = existingGuildCreateRequestRepository.findAllByStatus(
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();

        return Stream.concat(signupRequests.stream(), accountRequests.stream())
                .sorted((a, b) -> b.getRequestedAt().compareTo(a.getRequestedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuildJoinRequestResponse> getPendingMemberRequests(String loginId) {
        GuildMember actor = getApprovedGuildManager(loginId);

        List<GuildJoinRequestResponse> signupRequests = signupRequestRepository.findAllBySignupTypeAndGuildNameAndStatus(
                        MEMBER_SIGNUP,
                        actor.getGuild().getName(),
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();

        List<GuildJoinRequestResponse> accountRequests = existingGuildJoinRequestRepository.findAllByGuildAndStatus(
                        actor.getGuild(),
                        GuildMemberStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();

        return Stream.concat(signupRequests.stream(), accountRequests.stream())
                .sorted((a, b) -> b.getRequestedAt().compareTo(a.getRequestedAt()))
                .toList();
    }

    public void requestExistingAccountJoin(String loginId, String guildName) {
        User user = userService.findByLoginIdOrThrow(loginId);
        Guild guild = findApprovedGuildByName(normalizeRequired(guildName, "길드 이름"));

        if (guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED).isPresent()) {
            throw new IllegalStateException("이미 가입된 길드가 있습니다.");
        }

        if (existingGuildJoinRequestRepository.existsByUserAndStatus(user, GuildMemberStatus.PENDING)) {
            throw new IllegalStateException("이미 처리 대기 중인 가입 요청이 있습니다.");
        }

        if (guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(guild, user)) {
            throw new IllegalStateException("해당 길드에 재가입할 수 없습니다.");
        }

        existingGuildJoinRequestRepository.save(ExistingGuildJoinRequest.create(guild, user));
    }

    public void requestExistingAccountGuildCreate(String loginId, String guildName, String guildNameConfirm) {
        User user = userService.findByLoginIdOrThrow(loginId);
        String normalizedGuildName = normalizeRequired(guildName, "길드 이름");
        String normalizedGuildNameConfirm = normalizeRequired(guildNameConfirm, "길드 이름 확인");

        if (!normalizedGuildName.equals(normalizedGuildNameConfirm)) {
            throw new IllegalArgumentException("길드 이름 확인이 일치하지 않습니다.");
        }

        if (guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED).isPresent()) {
            throw new IllegalStateException("이미 가입된 길드가 있습니다.");
        }

        if (existingGuildJoinRequestRepository.existsByUserAndStatus(user, GuildMemberStatus.PENDING)
                || existingGuildCreateRequestRepository.existsByUserAndStatus(user, GuildMemberStatus.PENDING)) {
            throw new IllegalStateException("이미 처리 대기 중인 가입 또는 개설 요청이 있습니다.");
        }

        validateGuildNameCanBeRequested(normalizedGuildName);

        existingGuildCreateRequestRepository.save(
                ExistingGuildCreateRequest.create(user, normalizedGuildName)
        );
    }

    @Transactional(readOnly = true)
    public GuildJoinRequestResponse getMyPendingExistingJoinRequest(String loginId) {
        User user = userService.findByLoginIdOrThrow(loginId);
        GuildJoinRequestResponse joinRequest = existingGuildJoinRequestRepository.findFirstByUserAndStatusOrderByIdDesc(
                        user,
                        GuildMemberStatus.PENDING
                )
                .map(this::toResponse)
                .orElse(null);

        if (joinRequest != null) {
            return joinRequest;
        }

        return existingGuildCreateRequestRepository.findFirstByUserAndStatusOrderByIdDesc(
                        user,
                        GuildMemberStatus.PENDING
                )
                .map(this::toResponse)
                .orElse(null);
    }

    public void cancelMyPendingExistingJoinRequest(String loginId) {
        User user = userService.findByLoginIdOrThrow(loginId);
        ExistingGuildJoinRequest joinRequest = existingGuildJoinRequestRepository.findFirstByUserAndStatusOrderByIdDesc(
                        user,
                        GuildMemberStatus.PENDING
                )
                .orElse(null);

        if (joinRequest != null) {
            joinRequest.changeStatus(GuildMemberStatus.REJECTED);
            return;
        }

        ExistingGuildCreateRequest createRequest = existingGuildCreateRequestRepository.findFirstByUserAndStatusOrderByIdDesc(
                        user,
                        GuildMemberStatus.PENDING
                )
                .orElseThrow(() -> new NotFoundException("철회할 가입 또는 개설 요청이 없습니다."));

        createRequest.changeStatus(GuildMemberStatus.REJECTED);
    }

    public void approveMasterRequest(String loginId, Long requestId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        SignupRequest request = getPendingRequest(requestId, MASTER_SIGNUP);
        validateUserCanBeCreated(request);
        releaseInactiveGuildName(request.getGuildName());

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

    public void approveExistingMasterRequest(String loginId, Long requestId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        ExistingGuildCreateRequest request = getPendingExistingCreateRequest(requestId);
        User user = request.getUser();

        if (guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED).isPresent()) {
            throw new IllegalStateException("이미 가입된 길드가 있습니다.");
        }

        validateGuildNameCanBeApproved(request.getGuildName());
        releaseInactiveGuildName(request.getGuildName());

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

    public void rejectExistingMasterRequest(String loginId, Long requestId) {
        User actor = userService.findByLoginIdOrThrow(loginId);
        validateAdmin(actor);

        ExistingGuildCreateRequest request = getPendingExistingCreateRequest(requestId);
        request.changeStatus(GuildMemberStatus.REJECTED);
    }

    public void approveMemberRequest(String loginId, Long requestId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        SignupRequest request = getPendingRequest(requestId, MEMBER_SIGNUP);

        if (!actor.getGuild().getName().equals(request.getGuildName())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }

        validateUserCanBeCreated(request);
        validateGuildCapacity(actor.getGuild());

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

    public void approveExistingMemberRequest(String loginId, Long requestId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        ExistingGuildJoinRequest request = getPendingExistingRequest(requestId);

        if (!actor.getGuild().getId().equals(request.getGuild().getId())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }

        User user = request.getUser();
        if (guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED).isPresent()) {
            throw new IllegalStateException("이미 가입된 길드가 있습니다.");
        }

        if (guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(actor.getGuild(), user)) {
            throw new IllegalStateException("재가입 불가 목록에 있는 길드원입니다.");
        }

        validateGuildCapacity(actor.getGuild());

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

    public void rejectExistingMemberRequest(String loginId, Long requestId) {
        GuildMember actor = getApprovedGuildManager(loginId);
        ExistingGuildJoinRequest request = getPendingExistingRequest(requestId);

        if (!actor.getGuild().getId().equals(request.getGuild().getId())) {
            throw new IllegalStateException("같은 길드의 가입 신청만 처리할 수 있습니다.");
        }

        request.changeStatus(GuildMemberStatus.REJECTED);
    }

    private void validateGuildCapacity(Guild guild) {
        int count = guildMemberRepository.countByGuildAndStatus(guild, GuildMemberStatus.APPROVED);
        if (count >= MAX_GUILD_MEMBER_COUNT) {
            throw new IllegalStateException("길드 최대 인원(35명)을 초과할 수 없습니다.");
        }
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
        GuildMember actor = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(actorUser, GuildMemberStatus.APPROVED)
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

    private ExistingGuildJoinRequest getPendingExistingRequest(Long requestId) {
        ExistingGuildJoinRequest request = existingGuildJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("가입 신청을 찾을 수 없습니다."));

        if (request.getStatus() != GuildMemberStatus.PENDING) {
            throw new IllegalArgumentException("대기 중인 가입 신청이 아닙니다.");
        }

        return request;
    }

    private ExistingGuildCreateRequest getPendingExistingCreateRequest(Long requestId) {
        ExistingGuildCreateRequest request = existingGuildCreateRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("길드 개설 신청을 찾을 수 없습니다."));

        if (request.getStatus() != GuildMemberStatus.PENDING) {
            throw new IllegalArgumentException("대기 중인 길드 개설 신청이 아닙니다.");
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
                REQUEST_SOURCE_SIGNUP,
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

    private GuildJoinRequestResponse toResponse(ExistingGuildJoinRequest request) {
        Guild guild = request.getGuild();
        User user = request.getUser();

        return new GuildJoinRequestResponse(
                request.getId(),
                REQUEST_SOURCE_ACCOUNT,
                guild.getId(),
                guild.getName(),
                user.getId(),
                user.getLoginId(),
                user.getNickname(),
                user.getEmail(),
                user.getNickname(),
                GuildMemberRole.MEMBER,
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    private GuildJoinRequestResponse toResponse(ExistingGuildCreateRequest request) {
        User user = request.getUser();

        return new GuildJoinRequestResponse(
                request.getId(),
                REQUEST_SOURCE_ACCOUNT_MASTER,
                null,
                request.getGuildName(),
                user.getId(),
                user.getLoginId(),
                user.getNickname(),
                user.getEmail(),
                user.getNickname(),
                GuildMemberRole.MASTER,
                request.getStatus(),
                request.getCreatedAt()
        );
    }

    private Guild findApprovedGuildByName(String guildName) {
        Guild guild = guildRepository.findByName(guildName)
                .orElseThrow(() -> new IllegalArgumentException("가입 가능한 길드가 아닙니다."));

        boolean approvedMasterExists = guildMemberRepository.existsByGuildAndRoleAndStatus(
                guild,
                GuildMemberRole.MASTER,
                GuildMemberStatus.APPROVED
        );

        if (!approvedMasterExists) {
            throw new IllegalArgumentException("가입 가능한 길드가 아닙니다.");
        }

        return guild;
    }

    private void validateGuildNameCanBeRequested(String guildName) {
        if (activeGuildNameExists(guildName)
                || signupRequestRepository.existsBySignupTypeAndGuildNameAndStatus(
                MASTER_SIGNUP,
                guildName,
                GuildMemberStatus.PENDING
        )
                || existingGuildCreateRequestRepository.existsByGuildNameAndStatus(
                guildName,
                GuildMemberStatus.PENDING
        )) {
            throw new IllegalArgumentException("이미 사용 중이거나 개설 대기 중인 길드 이름입니다.");
        }
    }

    private void validateGuildNameCanBeApproved(String guildName) {
        if (activeGuildNameExists(guildName)
                || signupRequestRepository.existsBySignupTypeAndGuildNameAndStatus(
                MASTER_SIGNUP,
                guildName,
                GuildMemberStatus.PENDING
        )) {
            throw new IllegalArgumentException("이미 사용 중이거나 개설 대기 중인 길드 이름입니다.");
        }
    }

    private boolean activeGuildNameExists(String guildName) {
        return guildRepository.findByName(guildName)
                .filter(this::hasApprovedMaster)
                .isPresent();
    }

    private boolean hasApprovedMaster(Guild guild) {
        return guildMemberRepository.existsByGuildAndRoleAndStatus(
                guild,
                GuildMemberRole.MASTER,
                GuildMemberStatus.APPROVED
        );
    }

    private void releaseInactiveGuildName(String guildName) {
        guildRepository.findByName(guildName)
                .filter(guild -> !hasApprovedMaster(guild))
                .ifPresent(guild -> {
                    guild.setName(buildDisbandedGuildName(guild));
                    guildRepository.flush();
                });
    }

    private String buildDisbandedGuildName(Guild guild) {
        String suffix = "__closed_" + guild.getId();
        int maxBaseLength = Math.max(1, 50 - suffix.length());
        String baseName = guild.getName().length() > maxBaseLength
                ? guild.getName().substring(0, maxBaseLength)
                : guild.getName();
        return baseName + suffix;
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을 입력해주세요.");
        }

        return value.trim();
    }
}
