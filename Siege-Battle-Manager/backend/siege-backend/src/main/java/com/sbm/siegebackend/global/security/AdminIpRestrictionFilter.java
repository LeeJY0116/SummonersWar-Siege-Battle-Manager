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
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(10)
public class AdminIpRestrictionFilter extends OncePerRequestFilter {

    private final Set<String> allowedIps;

    public AdminIpRestrictionFilter(@Value("${security.admin.allowed-ips:}") String allowedIps) {
        this.allowedIps = Arrays.stream(allowedIps.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toSet());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!isAdminPath(request.getRequestURI()) || allowedIps.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        if (allowedIps.contains(clientIp)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"관리자 페이지에 접근할 수 없는 IP입니다.\"}");
    }

    private boolean isAdminPath(String uri) {
        return uri.startsWith("/api/admin/") || uri.startsWith("/api/users/admin/");
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
}
