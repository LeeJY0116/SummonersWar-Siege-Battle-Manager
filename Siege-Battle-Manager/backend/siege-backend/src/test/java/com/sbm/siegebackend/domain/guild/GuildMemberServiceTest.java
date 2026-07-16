package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.deck.DefenseDeckService;
import com.sbm.siegebackend.domain.deck.OwnerlessDefenseDeck;
import com.sbm.siegebackend.domain.deck.OwnerlessDefenseDeckRepository;
import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.deck.OwnerlessDefenseDeckService;
import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryUpdateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberRoleUpdateRequest;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterAttribute;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.research.BattleResearchComment;
import com.sbm.siegebackend.domain.research.BattleResearchCommentRepository;
import com.sbm.siegebackend.domain.research.BattleResearchPost;
import com.sbm.siegebackend.domain.research.BattleResearchPostRepository;
import com.sbm.siegebackend.domain.research.BattleResearchService;
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
    private GuildMemberInventoryRepository guildMemberInventoryRepository;

    @Autowired
    private DefenseDeckService defenseDeckService;

    @Autowired
    private OwnerlessDefenseDeckService ownerlessDefenseDeckService;

    @Autowired
    private OwnerlessDefenseDeckRepository ownerlessDefenseDeckRepository;

    @Autowired
    private GuildRepository guildRepository;

    @Autowired
    private GuildMemberRepository guildMemberRepository;

    @Autowired
    private GuildMemberBanRepository guildMemberBanRepository;

    @Autowired
    private MonsterRepository monsterRepository;

    @Autowired
    private BattleResearchService battleResearchService;

    @Autowired
    private BattleResearchPostRepository battleResearchPostRepository;

    @Autowired
    private BattleResearchCommentRepository battleResearchCommentRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void kick_real_member_marks_left_and_adds_active_ban() {
        GuildFixture fixture = createGuildFixture("kick");

        guildMemberService.kickRealMember(fixture.member.getId(), fixture.masterUser.getLoginId());

        assertThat(fixture.member.getStatus()).isEqualTo(GuildMemberStatus.LEFT);
        assertThat(guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(
                fixture.guild,
                fixture.memberUser
        )).isTrue();
    }

    @Test
    void sub_master_cannot_change_role_or_kick_member() {
        GuildFixture fixture = createGuildFixture("submaster-permission");
        GuildMemberRoleUpdateRequest request = new GuildMemberRoleUpdateRequest();
        request.setRole(GuildMemberRole.SUB_MASTER);

        assertThatThrownBy(() -> guildMemberService.changeRealMemberRole(
                fixture.member.getId(),
                fixture.subMasterUser.getLoginId(),
                request
        ))
                .isInstanceOf(ForbiddenException.class);

        assertThatThrownBy(() -> guildMemberService.kickRealMember(
                fixture.member.getId(),
                fixture.subMasterUser.getLoginId()
        ))
                .isInstanceOf(ForbiddenException.class);

        assertThat(fixture.member.getStatus()).isEqualTo(GuildMemberStatus.APPROVED);
        assertThat(guildMemberBanRepository.existsByGuildAndUserAndActiveTrue(
                fixture.guild,
                fixture.memberUser
        )).isFalse();
    }

    @Test
    void cannot_read_or_update_other_guild_inventory_by_direct_member_id() {
        GuildFixture myGuild = createGuildFixture("inventory-my");
        GuildFixture otherGuild = createGuildFixture("inventory-other");

        assertThatThrownBy(() -> guildMemberInventoryService.getInventory(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail()
        ))
                .isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() -> guildMemberInventoryService.updateInventory(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail(),
                emptyInventoryRequest()
        ))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cannot_create_other_guild_deck_by_direct_member_id() {
        GuildFixture myGuild = createGuildFixture("deck-my");
        GuildFixture otherGuild = createGuildFixture("deck-other");
        DefenseDeckCreateRequest request = new DefenseDeckCreateRequest();
        request.setMonsterCodes(List.of("m1", "m2", "m3"));

        assertThatThrownBy(() -> defenseDeckService.createDeck(
                otherGuild.member.getId(),
                myGuild.masterUser.getEmail(),
                request
        ))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void same_guild_member_cannot_manage_other_member_inventory_or_deck() {
        GuildFixture fixture = createGuildFixture("same-guild-permission");
        List<Monster> monsters = createMonsters("same-guild-permission");
        saveInventory(fixture.subMaster, monsters);

        assertThatThrownBy(() -> guildMemberInventoryService.getInventory(
                fixture.subMaster.getId(),
                fixture.memberUser.getEmail()
        ))
                .isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() -> guildMemberInventoryService.updateInventory(
                fixture.subMaster.getId(),
                fixture.memberUser.getEmail(),
                emptyInventoryRequest()
        ))
                .isInstanceOf(IllegalStateException.class);

        DefenseDeckCreateRequest request = new DefenseDeckCreateRequest();
        request.setMonsterCodes(monsters.stream().map(Monster::getCode).toList());

        assertThatThrownBy(() -> defenseDeckService.createDeck(
                fixture.subMaster.getId(),
                fixture.memberUser.getEmail(),
                request
        ))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void defense_deck_delete_requires_same_guild_and_owner_or_manager() {
        GuildFixture myGuild = createGuildFixture("delete-deck-my");
        GuildFixture otherGuild = createGuildFixture("delete-deck-other");
        List<Monster> otherMonsters = createMonsters("delete-deck-other");
        saveInventory(otherGuild.member, otherMonsters);

        DefenseDeckCreateRequest otherRequest = new DefenseDeckCreateRequest();
        otherRequest.setMonsterCodes(otherMonsters.stream().map(Monster::getCode).toList());
        Long otherDeckId = defenseDeckService.createDeck(
                otherGuild.member.getId(),
                otherGuild.masterUser.getEmail(),
                otherRequest
        );

        assertThatThrownBy(() -> defenseDeckService.deleteDeck(
                otherDeckId,
                myGuild.masterUser.getEmail()
        ))
                .isInstanceOf(IllegalStateException.class);

        List<Monster> sameGuildMonsters = createMonsters("delete-deck-same");
        saveInventory(myGuild.subMaster, sameGuildMonsters);

        DefenseDeckCreateRequest sameGuildRequest = new DefenseDeckCreateRequest();
        sameGuildRequest.setMonsterCodes(sameGuildMonsters.stream().map(Monster::getCode).toList());
        Long sameGuildDeckId = defenseDeckService.createDeck(
                myGuild.subMaster.getId(),
                myGuild.masterUser.getEmail(),
                sameGuildRequest
        );

        assertThatThrownBy(() -> defenseDeckService.deleteDeck(
                sameGuildDeckId,
                myGuild.memberUser.getEmail()
        ))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void battle_research_delete_requires_author_or_master_in_same_guild() {
        GuildFixture fixture = createGuildFixture("research-delete");
        List<Monster> monsters = createMonsters("research-delete");
        BattleResearchPost post = battleResearchPostRepository.save(new BattleResearchPost(
                fixture.guild,
                "title",
                "content",
                monsters,
                fixture.memberUser.getId(),
                fixture.member.getDisplayName()
        ));
        BattleResearchComment comment = battleResearchCommentRepository.save(new BattleResearchComment(
                post,
                List.of(),
                "comment",
                fixture.memberUser.getId(),
                fixture.member.getDisplayName()
        ));

        assertThatThrownBy(() -> battleResearchService.deletePost(
                fixture.subMasterUser.getEmail(),
                post.getId()
        ))
                .isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() -> battleResearchService.deleteComment(
                fixture.subMasterUser.getEmail(),
                comment.getId()
        ))
                .isInstanceOf(IllegalStateException.class);

        battleResearchService.deleteComment(fixture.memberUser.getEmail(), comment.getId());

        BattleResearchComment masterDeletedComment = battleResearchCommentRepository.save(new BattleResearchComment(
                post,
                List.of(),
                "master delete comment",
                fixture.memberUser.getId(),
                fixture.member.getDisplayName()
        ));
        battleResearchService.deleteComment(fixture.masterUser.getEmail(), masterDeletedComment.getId());

        battleResearchService.deletePost(fixture.masterUser.getEmail(), post.getId());

        assertThat(battleResearchPostRepository.findById(post.getId())).isEmpty();
        assertThat(battleResearchCommentRepository.findById(comment.getId())).isEmpty();
        assertThat(battleResearchCommentRepository.findById(masterDeletedComment.getId())).isEmpty();
    }

    @Test
    void battle_research_cannot_delete_other_guild_post_or_comment() {
        GuildFixture myGuild = createGuildFixture("research-other-my");
        GuildFixture otherGuild = createGuildFixture("research-other");
        List<Monster> monsters = createMonsters("research-other");
        BattleResearchPost otherPost = battleResearchPostRepository.save(new BattleResearchPost(
                otherGuild.guild,
                "title",
                "content",
                monsters,
                otherGuild.memberUser.getId(),
                otherGuild.member.getDisplayName()
        ));
        BattleResearchComment otherComment = battleResearchCommentRepository.save(new BattleResearchComment(
                otherPost,
                List.of(),
                "comment",
                otherGuild.memberUser.getId(),
                otherGuild.member.getDisplayName()
        ));

        assertThatThrownBy(() -> battleResearchService.deletePost(
                myGuild.masterUser.getEmail(),
                otherPost.getId()
        ))
                .isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() -> battleResearchService.deleteComment(
                myGuild.masterUser.getEmail(),
                otherComment.getId()
        ))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void ownerless_defense_deck_rejects_same_order_duplicate_deck() {
        GuildFixture fixture = createGuildFixture("ownerless-duplicate");
        List<Monster> monsters = createMonsters("ownerless-duplicate");
        OwnerlessDefenseDeckCreateRequest request = ownerlessDeckRequest(monsters);

        ownerlessDefenseDeckService.create(fixture.masterUser.getEmail(), request);

        OwnerlessDefenseDeckCreateRequest sameLeaderSwappedMembers = ownerlessDeckRequest(List.of(
                monsters.get(0),
                monsters.get(2),
                monsters.get(1)
        ));

        assertThatThrownBy(() -> ownerlessDefenseDeckService.create(
                fixture.masterUser.getEmail(),
                sameLeaderSwappedMembers
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("동일한 길드 방덱");
    }

    @Test
    void ownerless_defense_deck_can_be_deleted_by_sub_master() {
        GuildFixture fixture = createGuildFixture("ownerless-delete");
        List<Monster> monsters = createMonsters("ownerless-delete");
        Long deckId = ownerlessDefenseDeckService.create(
                fixture.masterUser.getEmail(),
                ownerlessDeckRequest(monsters)
        );

        ownerlessDefenseDeckService.delete(fixture.subMasterUser.getEmail(), deckId);

        assertThat(ownerlessDefenseDeckService.getList(fixture.masterUser.getEmail())).isEmpty();
    }

    @Test
    void ownerless_defense_deck_list_hides_existing_duplicate_decks() {
        GuildFixture fixture = createGuildFixture("ownerless-list-duplicate");
        List<Monster> monsters = createMonsters("ownerless-list-duplicate");
        ownerlessDefenseDeckRepository.save(new OwnerlessDefenseDeck(
                fixture.guild,
                "first",
                List.of(monsters.get(0), monsters.get(1), monsters.get(2))
        ));
        ownerlessDefenseDeckRepository.save(new OwnerlessDefenseDeck(
                fixture.guild,
                "duplicate",
                List.of(monsters.get(0), monsters.get(2), monsters.get(1))
        ));

        assertThat(ownerlessDefenseDeckService.getList(fixture.masterUser.getEmail()))
                .hasSize(1);
    }

    private GuildFixture createGuildFixture(String prefix) {
        User masterUser = createUser(prefix + "-master", prefix + "-master");
        Guild guild = guildRepository.save(new Guild(prefix + "-guild", "", masterUser));
        GuildMember master = createMember(guild, masterUser, GuildMemberRole.MASTER);

        User subMasterUser = createUser(prefix + "-submaster", prefix + "-submaster");
        GuildMember subMaster = createMember(guild, subMasterUser, GuildMemberRole.SUB_MASTER);

        User memberUser = createUser(prefix + "-member", prefix + "-member");
        GuildMember member = createMember(guild, memberUser, GuildMemberRole.MEMBER);

        guild.addMember(master);
        guild.addMember(subMaster);
        guild.addMember(member);

        return new GuildFixture(guild, masterUser, subMasterUser, memberUser, master, subMaster, member);
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

    private List<Monster> createMonsters(String prefix) {
        return List.of(
                createMonster(prefix + "-m1", MonsterAttribute.FIRE),
                createMonster(prefix + "-m2", MonsterAttribute.WATER),
                createMonster(prefix + "-m3", MonsterAttribute.WIND)
        );
    }

    private OwnerlessDefenseDeckCreateRequest ownerlessDeckRequest(List<Monster> monsters) {
        OwnerlessDefenseDeckCreateRequest request = new OwnerlessDefenseDeckCreateRequest();
        request.setTitle("길드 방덱");
        request.setMonsterCodes(monsters.stream().map(Monster::getCode).toList());
        return request;
    }

    private Monster createMonster(String code, MonsterAttribute attribute) {
        return monsterRepository.save(Monster.builder()
                .code(code)
                .name(code)
                .attribute(attribute)
                .leaderEffectType(null)
                .build());
    }

    private void saveInventory(GuildMember member, List<Monster> monsters) {
        monsters.forEach(monster -> guildMemberInventoryRepository.save(
                new GuildMemberInventory(member, monster, 1)
        ));
    }

    private record GuildFixture(
            Guild guild,
            User masterUser,
            User subMasterUser,
            User memberUser,
            GuildMember master,
            GuildMember subMaster,
            GuildMember member
    ) {
    }
}
