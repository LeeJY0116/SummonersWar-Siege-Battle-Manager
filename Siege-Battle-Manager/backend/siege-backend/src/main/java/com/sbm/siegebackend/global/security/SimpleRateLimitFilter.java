package com.sbm.siegebackend.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(20)
public class SimpleRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final boolean enabled;
    private final int loginLimitPerMinute;
    private final int signupLimitPerMinute;
    private final int guildRequestLimitPerMinute;
    private final int adminLimitPerMinute;
    private final Clock clock = Clock.systemUTC();

    public SimpleRateLimitFilter(
            @Value("${security.rate-limit.enabled:true}") boolean enabled,
            @Value("${security.rate-limit.login-per-minute:10}") int loginLimitPerMinute,
            @Value("${security.rate-limit.signup-per-minute:5}") int signupLimitPerMinute,
            @Value("${security.rate-limit.guild-request-per-minute:10}") int guildRequestLimitPerMinute,
            @Value("${security.rate-limit.admin-per-minute:120}") int adminLimitPerMinute
    ) {
        this.enabled = enabled;
        this.loginLimitPerMinute = loginLimitPerMinute;
        this.signupLimitPerMinute = signupLimitPerMinute;
        this.guildRequestLimitPerMinute = guildRequestLimitPerMinute;
        this.adminLimitPerMinute = adminLimitPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        int limit = resolveLimit(request);
        if (limit <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getMethod() + ":" + request.getRequestURI() + ":" + resolveClientIp(request);
        WindowCounter counter = counters.compute(key, (ignored, previous) -> nextCounter(previous));
        if (counter.count() <= limit) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\"}");
    }

    private int resolveLimit(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();

        if ("POST".equals(method) && "/api/users/login".equals(uri)) {
            return loginLimitPerMinute;
        }
        if ("POST".equals(method) && "/api/users/signup".equals(uri)) {
            return signupLimitPerMinute;
        }
        if ("POST".equals(method)
                && ("/api/guilds/join-requests".equals(uri) || "/api/guilds/create-requests".equals(uri))) {
            return guildRequestLimitPerMinute;
        }
        if (isAdminPath(uri)) {
            return adminLimitPerMinute;
        }

        return 0;
    }

    private boolean isAdminPath(String uri) {
        return uri.startsWith("/api/admin/") || uri.startsWith("/api/users/admin/");
    }

    private WindowCounter nextCounter(WindowCounter previous) {
        long now = clock.millis();
        long windowStart = now - (now % 60_000L);

        if (previous == null || previous.windowStart() != windowStart) {
            return new WindowCounter(windowStart, 1);
        }

        return new WindowCounter(windowStart, previous.count() + 1);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (hasText(cfIp)) {
            return normalizeLocalhost(cfIp.trim());
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (hasText(forwardedFor)) {
            return normalizeLocalhost(forwardedFor.split(",")[0].trim());
        }

        String realIp = request.getHeader("X-Real-IP");
        if (hasText(realIp)) {
            return normalizeLocalhost(realIp.trim());
        }

        return normalizeLocalhost(request.getRemoteAddr());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeLocalhost(String ip) {
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }
        if (ip != null && ip.startsWith("::ffff:")) {
            return ip.substring("::ffff:".length());
        }
        return ip;
    }

    private record WindowCounter(long windowStart, int count) {
    }
}
