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
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserSignUpResponse;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       SignupRequestRepository signupRequestRepository,
                       GuildRepository guildRepository,
                       GuildMemberRepository guildMemberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
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

        GuildMember member = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("가입 승인 정보가 없습니다."));

        if (member.getStatus() == GuildMemberStatus.APPROVED) {
            return;
        }

        if (member.getStatus() == GuildMemberStatus.REJECTED) {
            throw new IllegalArgumentException("가입 요청이 거절되었습니다.");
        }

        if (member.getRole() == GuildMemberRole.MASTER) {
            throw new IllegalArgumentException("관리자 승인 후 로그인할 수 있습니다.");
        }

        throw new IllegalArgumentException("길드장 승인 후 로그인할 수 있습니다.");
    }

    private void validateGuildSignUp(String signupType, String guildName) {
        if (isMasterSignUp(signupType)) {
            if (guildRepository.existsByName(guildName)
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

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        }

        return value.trim();
    }
}
