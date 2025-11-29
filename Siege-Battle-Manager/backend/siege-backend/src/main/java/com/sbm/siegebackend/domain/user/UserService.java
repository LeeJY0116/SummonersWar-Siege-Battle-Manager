package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.auth.JwtTokenProvider;
import com.sbm.siegebackend.domain.user.dto.UserLoginRequest;
import com.sbm.siegebackend.domain.user.dto.UserLoginResponse;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserSignUpResponse;
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

    // 생성자 주입
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * 회원가입
     */
    public UserSignUpResponse signUp(UserSignUpRequest request) {
        // 이메일 중복 검사
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 닉네임 중복 검사
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 비밀번호 해시
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // User 엔티티 생성
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordHash);
        user.setNickname(request.getNickname());
        user.setRole(UserRole.USER); // 기본 USER

        // 저장
        User saved = userRepository.save(user);

        // 응답 DTO로 변환
        return new UserSignUpResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getNickname()
        );
    }

    /**
     * 로그인
     */
    public UserLoginResponse login(UserLoginRequest request) {
        // 이메일로 사용자 조회
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        User user = optionalUser.orElseThrow(
                () -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.")
        );

        // 비밀번호 검증 (입력 평문 vs DB 해시)
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // ✅ 여기서 진짜 JWT 토큰 발급
        String token = jwtTokenProvider.createToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return new UserLoginResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                token
        );
    }
    @Transactional(readOnly = true)
    public User findByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
    }
}
