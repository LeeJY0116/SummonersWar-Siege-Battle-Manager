package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.Guild;
import com.sbm.siegebackend.domain.guild.GuildMember;
import com.sbm.siegebackend.domain.guild.GuildMemberRepository;
import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildRepository;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class UserServiceSignUpTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuildRepository guildRepository;

    @Autowired
    private GuildMemberRepository guildMemberRepository;

    @Test
    void 길드장_가입은_길드를_생성하고_마스터로_등록한다() {
        userService.signUp(signUpRequest(
                "master01",
                "master01@test.com",
                "길드장",
                "master",
                "테스트길드"
        ));

        User user = userRepository.findByLoginId("master01").orElseThrow();
        Guild guild = guildRepository.findByName("테스트길드").orElseThrow();
        GuildMember member = guildMemberRepository.findByUser(user).orElseThrow();

        assertThat(guild.getMaster().getId()).isEqualTo(user.getId());
        assertThat(member.getGuild().getId()).isEqualTo(guild.getId());
        assertThat(member.getRole()).isEqualTo(GuildMemberRole.MASTER);
        assertThat(member.getDisplayName()).isEqualTo("길드장");
    }

    @Test
    void 길드원_가입은_기존_길드에_멤버로_등록한다() {
        userService.signUp(signUpRequest(
                "master02",
                "master02@test.com",
                "길드장2",
                "master",
                "기존길드"
        ));

        userService.signUp(signUpRequest(
                "member01",
                "member01@test.com",
                "길드원",
                "member",
                "기존길드"
        ));

        User memberUser = userRepository.findByLoginId("member01").orElseThrow();
        Guild guild = guildRepository.findByName("기존길드").orElseThrow();
        GuildMember member = guildMemberRepository.findByUser(memberUser).orElseThrow();

        assertThat(member.getGuild().getId()).isEqualTo(guild.getId());
        assertThat(member.getRole()).isEqualTo(GuildMemberRole.MEMBER);
        assertThat(member.getDisplayName()).isEqualTo("길드원");
    }

    @Test
    void 길드원_가입은_없는_길드면_실패한다() {
        UserSignUpRequest request = signUpRequest(
                "member02",
                "member02@test.com",
                "길드원2",
                "member",
                "없는길드"
        );

        assertThatThrownBy(() -> userService.signUp(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("입력한 길드가 아직 생성되지 않아 가입할 수 없습니다.");
    }

    private UserSignUpRequest signUpRequest(
            String loginId,
            String email,
            String nickname,
            String signupType,
            String guildName
    ) {
        UserSignUpRequest request = new UserSignUpRequest();
        request.setLoginId(loginId);
        request.setEmail(email);
        request.setPassword("test");
        request.setNickname(nickname);
        request.setSignupType(signupType);
        request.setGuildName(guildName);
        return request;
    }
}
