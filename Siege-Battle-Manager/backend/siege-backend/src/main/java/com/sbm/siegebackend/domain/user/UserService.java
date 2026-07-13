package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.auth.JwtTokenProvider;
import com.sbm.siegebackend.domain.guild.Guild;
import com.sbm.siegebackend.domain.guild.GuildMember;
import com.sbm.siegebackend.domain.guild.GuildMemberRepository;
import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import com.sbm.siegebackend.domain.guild.GuildRepository;
import com.sbm.siegebackend.domain.user.dto.UserLoginRequest;
import com.sbm.siegebackend.domain.user.dto.UserLoginResponse;
import com.sbm.siegebackend.domain.user.dto.UserNicknameChangeRequestResponse;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserSignUpResponse;
import com.sbm.siegebackend.global.exception.ForbiddenException;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserNicknameChangeRequestRepository nicknameChangeRequestRepository;
    private final UserNicknameHistoryRepository userNicknameHistoryRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       UserNicknameChangeRequestRepository nicknameChangeRequestRepository,
                       UserNicknameHistoryRepository userNicknameHistoryRepository,
                       SignupRequestRepository signupRequestRepository,
                       GuildRepository guildRepository,
                       GuildMemberRepository guildMemberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.nicknameChangeRequestRepository = nicknameChangeRequestRepository;
        this.userNicknameHistoryRepository = userNicknameHistoryRepository;
        this.signupRequestRepository = signupRequestRepository;
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public UserSignUpResponse signUp(UserSignUpRequest request) {
        String loginId = normalizeRequired(request.getLoginId(), "아이디");
        String email = normalizeRequired(request.getEmail(), "이메일");
        String nickname = normalizeRequired(request.getNickname(), "닉네임");
        String signupType = normalizeRequired(request.getSignupType(), "가입 유형");
        String guildName = normalizeRequired(request.getGuildName(), "길드 이름");

        if (userRepository.existsByLoginId(loginId)
                || signupRequestRepository.existsByLoginIdAndStatus(loginId, GuildMemberStatus.PENDING)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByEmail(email)
                || signupRequestRepository.existsByEmailAndStatus(email, GuildMemberStatus.PENDING)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        if (userRepository.existsByNickname(nickname)
                || signupRequestRepository.existsByNicknameAndStatus(nickname, GuildMemberStatus.PENDING)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        validateGuildSignUp(signupType, guildName);

        SignupRequest saved = signupRequestRepository.save(new SignupRequest(
                loginId,
                email,
                passwordEncoder.encode(request.getPassword()),
                nickname,
                signupType.toLowerCase(),
                guildName
        ));

        return new UserSignUpResponse(
                saved.getId(),
                saved.getLoginId(),
                saved.getEmail(),
                saved.getNickname()
        );
    }

    public UserLoginResponse login(UserLoginRequest request) {
        return login(request, null);
    }

    public UserLoginResponse login(UserLoginRequest request, String loginIp) {
        String loginId = normalizeRequired(request.getLoginId(), "아이디");
        User user = findByLoginIdOrLegacyEmail(loginId)
                .orElse(null);

        if (user == null) {
            validatePendingSignupLogin(loginId, request.getPassword());
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        validateLoginApproval(user);

        if (user.getLoginId() == null || user.getLoginId().isBlank()) {
            user.setLoginId(loginId);
        }

        user.markLoggedIn(loginIp);

        String token = jwtTokenProvider.createToken(
                user.getId(),
                user.getLoginId(),
                user.getRole().name()
        );

        return new UserLoginResponse(
                user.getId(),
                user.getLoginId(),
                user.getEmail(),
                user.getNickname(),
                token
        );
    }

    public UserNicknameChangeRequestResponse requestNicknameChange(String loginId, String requestedNickname) {
        User user = findByLoginIdOrThrow(loginId);
        String nextNickname = normalizeRequired(requestedNickname, "변경할 닉네임");

        if (nextNickname.equals(user.getNickname())) {
            throw new IllegalArgumentException("현재 닉네임과 동일합니다.");
        }
        if (userRepository.existsByNickname(nextNickname)
                || nicknameChangeRequestRepository.existsByRequestedNicknameAndStatus(nextNickname, GuildMemberStatus.PENDING)) {
            throw new IllegalArgumentException("이미 사용 중이거나 요청 대기 중인 닉네임입니다.");
        }
        if (nicknameChangeRequestRepository.existsByUserAndStatus(user, GuildMemberStatus.PENDING)) {
            throw new IllegalStateException("이미 처리 대기 중인 닉네임 변경 요청이 있습니다.");
        }

        return toNicknameChangeResponse(
                nicknameChangeRequestRepository.save(UserNicknameChangeRequest.create(user, nextNickname))
        );
    }

    @Transactional(readOnly = true)
    public UserNicknameChangeRequestResponse getMyPendingNicknameChangeRequest(String loginId) {
        User user = findByLoginIdOrThrow(loginId);
        return nicknameChangeRequestRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.PENDING)
                .map(this::toNicknameChangeResponse)
                .orElse(null);
    }

    public void cancelMyPendingNicknameChangeRequest(String loginId) {
        User user = findByLoginIdOrThrow(loginId);
        UserNicknameChangeRequest request = nicknameChangeRequestRepository
                .findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("철회할 닉네임 변경 요청이 없습니다."));

        request.reject(user);
    }

    @Transactional(readOnly = true)
    public List<UserNicknameChangeRequestResponse> getPendingNicknameChangeRequests(String loginId) {
        validateAdmin(loginId);

        return nicknameChangeRequestRepository.findAllByStatusOrderByIdDesc(GuildMemberStatus.PENDING)
                .stream()
                .map(this::toNicknameChangeResponse)
                .toList();
    }

    public void approveNicknameChangeRequest(String loginId, Long requestId) {
        User admin = validateAdmin(loginId);
        UserNicknameChangeRequest request = getPendingNicknameChangeRequest(requestId);
        User user = request.getUser();
        String previousNickname = user.getNickname();
        String nextNickname = request.getRequestedNickname();

        if (!nextNickname.equals(previousNickname) && userRepository.existsByNickname(nextNickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        user.setNickname(nextNickname);
        guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .ifPresent(member -> member.changeDisplayName(nextNickname));
        userNicknameHistoryRepository.save(UserNicknameHistory.create(
                user,
                previousNickname,
                nextNickname,
                admin,
                "ADMIN_APPROVED"
        ));
        request.approve(admin);
    }

    public void rejectNicknameChangeRequest(String loginId, Long requestId) {
        User admin = validateAdmin(loginId);
        UserNicknameChangeRequest request = getPendingNicknameChangeRequest(requestId);
        request.reject(admin);
    }

    @Transactional(readOnly = true)
    public User findByEmailOrThrow(String email) {
        return findByLoginIdOrThrow(email);
    }

    @Transactional(readOnly = true)
    public User findByLoginIdOrThrow(String loginId) {
        return findByLoginIdOrLegacyEmail(loginId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + loginId));
    }

    private Optional<User> findByLoginIdOrLegacyEmail(String loginId) {
        return userRepository.findByLoginId(loginId)
                .or(() -> userRepository.findByEmail(loginId))
                .or(() -> userRepository.findByNickname(loginId));
    }

    private User validateAdmin(String loginId) {
        User user = findByLoginIdOrThrow(loginId);
        if (user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("관리자만 처리할 수 있습니다.");
        }

        return user;
    }

    private UserNicknameChangeRequest getPendingNicknameChangeRequest(Long requestId) {
        UserNicknameChangeRequest request = nicknameChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("닉네임 변경 요청을 찾을 수 없습니다."));

        if (request.getStatus() != GuildMemberStatus.PENDING) {
            throw new IllegalArgumentException("대기 중인 닉네임 변경 요청이 아닙니다.");
        }

        return request;
    }

    private UserNicknameChangeRequestResponse toNicknameChangeResponse(UserNicknameChangeRequest request) {
        User user = request.getUser();
        User reviewedBy = request.getReviewedBy();
        return new UserNicknameChangeRequestResponse(
                request.getId(),
                user.getId(),
                user.getLoginId(),
                user.getEmail(),
                request.getPreviousNickname(),
                request.getRequestedNickname(),
                request.getStatus(),
                reviewedBy == null ? null : reviewedBy.getLoginId(),
                request.getReviewedAt(),
                request.getCreatedAt()
        );
    }

    private void validatePendingSignupLogin(String loginId, String password) {
        Optional<SignupRequest> optionalRequest = signupRequestRepository
                .findFirstByLoginIdAndStatus(loginId, GuildMemberStatus.PENDING)
                .or(() -> signupRequestRepository.findFirstByEmailAndStatus(loginId, GuildMemberStatus.PENDING))
                .or(() -> signupRequestRepository.findFirstByNicknameAndStatus(loginId, GuildMemberStatus.PENDING));

        if (optionalRequest.isEmpty()) {
            return;
        }

        SignupRequest signupRequest = optionalRequest.get();
        if (!passwordEncoder.matches(password, signupRequest.getPasswordHash())) {
            return;
        }

        if (isMasterSignUp(signupRequest.getSignupType())) {
            throw new IllegalArgumentException("관리자 승인 후 로그인할 수 있습니다.");
        }

        throw new IllegalArgumentException("길드장 승인 후 로그인할 수 있습니다.");
    }

    private void validateLoginApproval(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }

        GuildMember member = guildMemberRepository.findFirstByUserOrderByIdDesc(user)
                .orElse(null);

        if (member == null) {
            return;
        }

        if (member.getStatus() == GuildMemberStatus.APPROVED) {
            return;
        }

        if (member.getStatus() == GuildMemberStatus.REJECTED) {
            throw new IllegalArgumentException("가입 요청이 거절되었습니다.");
        }

        if (member.getStatus() == GuildMemberStatus.LEFT) {
            return;
        }

        if (member.getRole() == GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("관리자 승인 후 로그인할 수 있습니다.");
        }

        throw new IllegalArgumentException("길드장 승인 후 로그인할 수 있습니다.");
    }

    private void validateGuildSignUp(String signupType, String guildName) {
        if (isMasterSignUp(signupType)) {
            if (activeGuildNameExists(guildName)
                    || signupRequestRepository.existsBySignupTypeAndGuildNameAndStatus(
                    "master",
                    guildName,
                    GuildMemberStatus.PENDING
            )) {
                throw new IllegalArgumentException("이미 존재하는 길드 이름입니다.");
            }
            return;
        }

        if (isMemberSignUp(signupType)) {
            findApprovedGuildByName(guildName);
            return;
        }

        throw new IllegalArgumentException("가입 유형이 올바르지 않습니다.");
    }

    private boolean isMasterSignUp(String signupType) {
        return "master".equalsIgnoreCase(signupType);
    }

    private boolean isMemberSignUp(String signupType) {
        return "member".equalsIgnoreCase(signupType);
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

    private boolean activeGuildNameExists(String guildName) {
        return guildRepository.findByName(guildName)
                .filter(guild -> guildMemberRepository.existsByGuildAndRoleAndStatus(
                        guild,
                        GuildMemberRole.MASTER,
                        GuildMemberStatus.APPROVED
                ))
                .isPresent();
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        }

        return value.trim();
    }
}
