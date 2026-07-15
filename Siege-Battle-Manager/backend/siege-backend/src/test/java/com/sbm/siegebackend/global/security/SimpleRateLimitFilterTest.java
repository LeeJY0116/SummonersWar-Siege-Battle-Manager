package com.sbm.siegebackend.global.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class SimpleRateLimitFilterTest {

    @Test
    void loginRequestIsRejectedAfterConfiguredLimit() throws Exception {
        SimpleRateLimitFilter filter = new SimpleRateLimitFilter(
                true,
                10,
                5,
                10,
                120
        );

        for (int i = 1; i <= 10; i++) {
            MockHttpServletResponse response = sendLoginRequest(filter);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blockedResponse = sendLoginRequest(filter);

        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("요청이 너무 많습니다");
    }

    private MockHttpServletResponse sendLoginRequest(SimpleRateLimitFilter filter) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users/login");
        request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        return response;
    }
}
