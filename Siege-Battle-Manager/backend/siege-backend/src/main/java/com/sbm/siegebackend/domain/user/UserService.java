package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.auth.JwtTokenProvider;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public UserSignUpResponse signUp(UserSignUpRequest request) {
        String loginId = normalizeRequired(request.getLoginId(), "아이디");
        String email = normalizeRequired(request.getEmail(), "이메일");
        String nickname = normalizeRequired(request.getNickname(), "닉네임");

        if (userRepository.existsByLoginId(loginId)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        User user = new User();
        user.setLoginId(loginId);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(nickname);
        user.setRole(UserRole.USER);

        User saved = userRepository.save(user);

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
                .or(() -> userRepository.findByEmail(loginId));
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + "을(를) 입력해주세요.");
        }

        return value.trim();
    }
}
