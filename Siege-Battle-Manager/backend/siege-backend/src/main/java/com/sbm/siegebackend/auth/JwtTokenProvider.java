package com.sbm.siegebackend.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * JWT 토큰 생성 담당
 */
@Component
public class JwtTokenProvider {

    // TODO: 나중에는 application.yml에서 주입받도록 수정하면 좋음
    private static final String SECRET_KEY = "THIS_IS_VERY_SECRET_KEY_FOR_SIEGE_MANAGER_256BIT!";
    private static final long TOKEN_VALIDITY_MILLIS = 1000L * 60 * 60; // 1시간

    private final Key key;

    public JwtTokenProvider() {
        // 256bit 이상 키 필요 → 문자열을 바이트로 변환해서 키 생성
        this.key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * JWT 토큰 생성
     */
    public String createToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + TOKEN_VALIDITY_MILLIS);

        return Jwts.builder()
                .setSubject(email)               // 토큰 주체(subject)에 이메일 저장
                .claim("userId", userId)         // 커스텀 클레임
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    /**
     * 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // 서명 불일치, 만료, 형식 오류 등
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserId(String token) {
        Object userId = getClaims(token).get("userId");
        // JJWT가 숫자를 Long/Integer로 줄 수 있으므로 안전하게 캐스팅
        if (userId instanceof Integer i) {
            return i.longValue();
        } else if (userId instanceof Long l) {
            return l;
        } else if (userId instanceof String s) {
            return Long.parseLong(s);
        }
        return null;
    }

    public String getRole(String token) {
        Object role = getClaims(token).get("role");
        return role != null ? role.toString() : null;
    }

}
