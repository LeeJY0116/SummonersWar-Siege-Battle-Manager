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
    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       GuildRepository guildRepository,
                       GuildMemberRepository guildMemberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
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

        if (userRepository.existsByLoginId(loginId)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        validateGuildSignUp(signupType, guildName);

        User user = new User();
        user.setLoginId(loginId);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(nickname);
        user.setRole(UserRole.USER);

        User saved = userRepository.save(user);
        registerGuildMember(signupType, guildName, saved);

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
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

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

    private void validateGuildSignUp(String signupType, String guildName) {
        if (isMasterSignUp(signupType)) {
            if (guildRepository.existsByName(guildName)) {
                throw new IllegalArgumentException("이미 존재하는 길드 이름입니다.");
            }
            return;
        }

        if (isMemberSignUp(signupType)) {
            if (!guildRepository.existsByName(guildName)) {
                throw new IllegalArgumentException("입력한 길드가 아직 생성되지 않아 가입할 수 없습니다.");
            }
            return;
        }

        throw new IllegalArgumentException("가입 유형이 올바르지 않습니다.");
    }

    private void registerGuildMember(String signupType, String guildName, User user) {
        if (isMasterSignUp(signupType)) {
            Guild guild = guildRepository.save(new Guild(guildName, "", user));
            GuildMember member = GuildMember.createReal(
                    guild,
                    user,
                    GuildMemberRole.MASTER,
                    GuildMemberStatus.PENDING
            );
            guildMemberRepository.save(member);
            guild.addMember(member);
            return;
        }

        Guild guild = guildRepository.findByName(guildName)
                .orElseThrow(() -> new IllegalArgumentException("입력한 길드가 아직 생성되지 않아 가입할 수 없습니다."));
        GuildMember member = GuildMember.createReal(
                guild,
                user,
                GuildMemberRole.MEMBER,
                GuildMemberStatus.PENDING
        );
        guildMemberRepository.save(member);
        guild.addMember(member);
    }

    private boolean isMasterSignUp(String signupType) {
        return "master".equalsIgnoreCase(signupType);
    }

    private boolean isMemberSignUp(String signupType) {
        return "member".equalsIgnoreCase(signupType);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        }

        return value.trim();
    }
}
