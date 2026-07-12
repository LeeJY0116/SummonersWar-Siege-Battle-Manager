package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.Guild;
import com.sbm.siegebackend.domain.guild.GuildApprovalService;
import com.sbm.siegebackend.domain.guild.GuildMember;
import com.sbm.siegebackend.domain.guild.GuildMemberRepository;
import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import com.sbm.siegebackend.domain.guild.GuildRepository;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserLoginRequest;
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
    private GuildApprovalService guildApprovalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SignupRequestRepository signupRequestRepository;

    @Autowired
    private GuildRepository guildRepository;

    @Autowired
    private GuildMemberRepository guildMemberRepository;

    @Test
    void 길드장_가입은_계정과_길드를_바로_생성하지_않고_신청만_생성한다() {
        userService.signUp(signUpRequest(
                "master01",
                "master01@test.com",
                "길드장",
                "master",
                "테스트길드"
        ));

        SignupRequest request = signupRequestRepository
                .findAllBySignupTypeAndStatus("master", GuildMemberStatus.PENDING)
                .get(0);

        assertThat(request.getLoginId()).isEqualTo("master01");
        assertThat(request.getGuildName()).isEqualTo("테스트길드");
        assertThat(userRepository.findByLoginId("master01")).isEmpty();
        assertThat(guildRepository.findByName("테스트길드")).isEmpty();
    }

    @Test
    void 승인_대기_신청자는_로그인_시_승인_대기_메시지를_받는다() {
        userService.signUp(signUpRequest(
                "pending01",
                "pending01@test.com",
                "대기장",
                "master",
                "대기길드"
        ));

        UserLoginRequest request = new UserLoginRequest();
        request.setLoginId("pending01");
        request.setPassword("test");

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 승인 후 로그인할 수 있습니다.");
    }

    @Test
    void 승인_대기_신청자라도_비밀번호가_틀리면_로그인_오류를_받는다() {
        userService.signUp(signUpRequest(
                "pending02",
                "pending02@test.com",
                "대기장2",
                "master",
                "대기길드2"
        ));

        UserLoginRequest request = new UserLoginRequest();
        request.setLoginId("pending02");
        request.setPassword("wrong");

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    @Test
    void 관리자_승인_후_길드장_계정과_길드가_생성된다() {
        User admin = createAdmin();

        userService.signUp(signUpRequest(
                "master02",
                "master02@test.com",
                "길드장",
                "master",
                "승인길드"
        ));

        SignupRequest request = signupRequestRepository
                .findAllBySignupTypeAndStatus("master", GuildMemberStatus.PENDING)
                .get(0);

        guildApprovalService.approveMasterRequest(admin.getLoginId(), request.getId());

        User user = userRepository.findByLoginId("master02").orElseThrow();
        Guild guild = guildRepository.findByName("승인길드").orElseThrow();
        GuildMember member = guildMemberRepository.findByUser(user).orElseThrow();

        assertThat(guild.getMaster().getId()).isEqualTo(user.getId());
        assertThat(member.getGuild().getId()).isEqualTo(guild.getId());
        assertThat(member.getRole()).isEqualTo(GuildMemberRole.MASTER);
        assertThat(member.getStatus()).isEqualTo(GuildMemberStatus.APPROVED);
    }

    @Test
    void 길드원_가입은_승인된_길드에만_신청할_수_있다() {
        createApprovedGuild("기존길드");

        userService.signUp(signUpRequest(
                "member01",
                "member01@test.com",
                "길드원",
                "member",
                "기존길드"
        ));

        SignupRequest request = signupRequestRepository
                .findAllBySignupTypeAndGuildNameAndStatus(
                        "member",
                        "기존길드",
                        GuildMemberStatus.PENDING
                )
                .get(0);

        assertThat(request.getLoginId()).isEqualTo("member01");
        assertThat(userRepository.findByLoginId("member01")).isEmpty();
    }

    @Test
    void 가입_거절_후_같은_아이디로_다시_신청할_수_있다() {
        User admin = createAdmin();

        userService.signUp(signUpRequest(
                "master03",
                "master03@test.com",
                "거절대상",
                "master",
                "거절길드"
        ));

        SignupRequest request = signupRequestRepository
                .findAllBySignupTypeAndStatus("master", GuildMemberStatus.PENDING)
                .get(0);
        guildApprovalService.rejectMasterRequest(admin.getLoginId(), request.getId());

        userService.signUp(signUpRequest(
                "master03",
                "master03@test.com",
                "거절대상",
                "master",
                "거절길드"
        ));

        assertThat(signupRequestRepository.findAllBySignupTypeAndStatus(
                "master",
                GuildMemberStatus.PENDING
        )).hasSize(1);
    }

    @Test
    void 길드원_가입은_승인되지_않은_길드면_실패한다() {
        userService.signUp(signUpRequest(
                "master04",
                "master04@test.com",
                "미승인장",
                "master",
                "미승인길드"
        ));

        UserSignUpRequest request = signUpRequest(
                "member02",
                "member02@test.com",
                "길드원",
                "member",
                "미승인길드"
        );

        assertThatThrownBy(() -> userService.signUp(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("가입 가능한 길드가 아닙니다.");
    }

    private Guild createApprovedGuild(String guildName) {
        User admin = createAdmin();
        userService.signUp(signUpRequest(
                guildName + "master",
                guildName + "master@test.com",
                guildName + "마스터",
                "master",
                guildName
        ));
        SignupRequest request = signupRequestRepository
                .findAllBySignupTypeAndStatus("master", GuildMemberStatus.PENDING)
                .get(0);
        guildApprovalService.approveMasterRequest(admin.getLoginId(), request.getId());
        return guildRepository.findByName(guildName).orElseThrow();
    }

    private User createAdmin() {
        return userRepository.findByLoginId("admin-test")
                .orElseGet(() -> {
                    User admin = new User();
                    admin.setLoginId("admin-test");
                    admin.setEmail("admin-test@example.com");
                    admin.setPasswordHash("test");
                    admin.setNickname("admin-test");
                    admin.setRole(UserRole.ADMIN);
                    return userRepository.save(admin);
                });
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
