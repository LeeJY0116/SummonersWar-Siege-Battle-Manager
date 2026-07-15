package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.deck.DefenseDeckService;
import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryUpdateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberRoleUpdateRequest;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserRepository;
import com.sbm.siegebackend.domain.user.UserRole;
import com.sbm.siegebackend.global.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GuildMemberServiceTest {

    @Autowired
    private GuildMemberService guildMemberService;

    @Autowired
    private GuildMemberInventoryService guildMemberInventoryService;

    @Autowired
    private DefenseDeckService defenseDeckService;

    @Autowired
    private GuildRepository guildRepository;

    @Autowired
    private GuildMemberRepository guildMemberRepository;

    @Autowired
    private GuildMemberBanRepository guildMemberBanRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void 길드장_추방은_길드원을_LEFT로_변경하고_재가입을_차단한다() {
        GuildFixture fixture = createGuildFixture("kick");

        guildMemberService.kickRealMember(fixture.member.getId(), fixture.masterUser.getLoginId());

        assertThat(fixture.member.getStatus()).isEqualTo(GuildMemberStatus.LEFT);
        assertThat(guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(
                fixture.guild,
                fixture.memberUser
        )).isTrue();
    }

    @Test
    void 부길드장은_등급_변경과_추방을_할_수_없다() {
        GuildFixture fixture = createGuildFixture("submaster-permission");
        GuildMemberRoleUpdateRequest request = new GuildMemberRoleUpdateRequest();
        request.setRole(GuildMemberRole.SUB_MASTER);

        assertThatThrownBy(() -> guildMemberService.changeRealMemberRole(
                fixture.member.getId(),
                fixture.subMasterUser.getLoginId(),
                request
        ))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("길드장만 처리할 수 있습니다.");

        assertThatThrownBy(() -> guildMemberService.kickRealMember(
                fixture.member.getId(),
                fixture.subMasterUser.getLoginId()
        ))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("길드장만 처리할 수 있습니다.");

        assertThat(fixture.member.getStatus()).isEqualTo(GuildMemberStatus.APPROVED);
        assertThat(guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(
                fixture.guild,
                fixture.memberUser
        )).isFalse();
    }

    @Test
    void 다른_길드원의_인벤토리는_직접_ID로도_조회하거나_수정할_수_없다() {
        GuildFixture myGuild = createGuildFixture("inventory-my");
        GuildFixture otherGuild = createGuildFixture("inventory-other");

        assertThatThrownBy(() -> guildMemberInventoryService.getInventory(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail()
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("다른 길드원의 인벤토리는 조회할 수 없습니다.");

        assertThatThrownBy(() -> guildMemberInventoryService.updateInventory(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail(),
                emptyInventoryRequest()
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("다른 길드의 인벤토리는 수정할 수 없습니다.");
    }

    @Test
    void 다른_길드원의_방덱은_직접_ID로도_생성할_수_없다() {
        GuildFixture myGuild = createGuildFixture("deck-my");
        GuildFixture otherGuild = createGuildFixture("deck-other");
        DefenseDeckCreateRequest request = new DefenseDeckCreateRequest();
        request.setMonsterCodes(List.of("m1", "m2", "m3"));

        assertThatThrownBy(() -> defenseDeckService.createDeck(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail(),
                request
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("다른 길드원의 방덱은 생성할 수 없습니다.");
    }

    private GuildFixture createGuildFixture(String prefix) {
        User masterUser = createUser(prefix + "-master", prefix + "마스터");
        Guild guild = guildRepository.save(new Guild(prefix + "-guild", "", masterUser));
        GuildMember master = createMember(guild, masterUser, GuildMemberRole.MASTER);

        User subMasterUser = createUser(prefix + "-submaster", prefix + "부길드장");
        GuildMember subMaster = createMember(guild, subMasterUser, GuildMemberRole.SUB_MASTER);

        User memberUser = createUser(prefix + "-member", prefix + "길드원");
        GuildMember member = createMember(guild, memberUser, GuildMemberRole.MEMBER);

        guild.addMember(master);
        guild.addMember(subMaster);
        guild.addMember(member);

        return new GuildFixture(guild, masterUser, subMasterUser, memberUser, member);
    }

    private User createUser(String loginId, String nickname) {
        return userRepository.save(User.create(
                loginId,
                loginId + "@test.com",
                "test",
                nickname,
                UserRole.USER
        ));
    }

    private GuildMember createMember(Guild guild, User user, GuildMemberRole role) {
        return guildMemberRepository.save(GuildMember.createReal(
                guild,
                user,
                role,
                GuildMemberStatus.APPROVED
        ));
    }

    private GuildMemberInventoryUpdateRequest emptyInventoryRequest() {
        GuildMemberInventoryUpdateRequest request = new GuildMemberInventoryUpdateRequest();
        request.setItems(List.of());
        return request;
    }

    private record GuildFixture(
            Guild guild,
            User masterUser,
            User subMasterUser,
            User memberUser,
            GuildMember member
    ) {
    }
}
