package com.sbm.siegebackend.config;

import com.sbm.siegebackend.auth.JwtTokenProvider;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserRepository;
import com.sbm.siegebackend.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Test
    void admin_api_requires_login() throws Exception {
        mockMvc.perform(get("/api/admin/guilds"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("로그인이 필요합니다.")));
    }

    @Test
    void admin_api_rejects_user_token() throws Exception {
        User user = createUser("security-user", UserRole.USER);
        String token = jwtTokenProvider.createToken(user.getId(), user.getLoginId(), user.getRole().name());

        mockMvc.perform(get("/api/admin/guilds")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("접근 권한이 없습니다.")));
    }

    @Test
    void admin_api_accepts_admin_token() throws Exception {
        User admin = createUser("security-admin", UserRole.ADMIN);
        String token = jwtTokenProvider.createToken(admin.getId(), admin.getLoginId(), admin.getRole().name());

        mockMvc.perform(get("/api/admin/guilds")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    private User createUser(String loginId, UserRole role) {
        return userRepository.save(User.create(
                loginId,
                loginId + "@test.com",
                "password",
                loginId,
                role
        ));
    }
}
