package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.deck.dto.DefenseDeckResponse;
import com.sbm.siegebackend.domain.guild.*;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@Transactional
public class DefenseDeckService {

    private final DefenseDeckRepository defenseDeckRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final GuildMemberInventoryRepository inventoryRepository;
    private final MonsterRepository monsterRepository;
    private final UserService userService;

    public DefenseDeckService(DefenseDeckRepository defenseDeckRepository,
                              GuildMemberRepository guildMemberRepository,
                              GuildMemberInventoryRepository inventoryRepository,
                              MonsterRepository monsterRepository,
                              UserService userService) {
        this.defenseDeckRepository = defenseDeckRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.inventoryRepository = inventoryRepository;
        this.monsterRepository = monsterRepository;
        this.userService = userService;
    }

    /**
     * 방덱 생성
     *
     * 정책:
     * - 인벤 quantity는 "총 보유 수량"으로 본다.
     * - 방덱 생성 시 quantity를 직접 차감하지 않는다.
     * - 사용 가능 수량 = 총 보유 수량 - 현재 방덱에서 사용 중인 수량.
     */
    public Long createDeck(Long ownerMemberId, String email, DefenseDeckCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        GuildMember owner = guildMemberRepository.findById(ownerMemberId)
                .orElseThrow(() -> new NotFoundException("대상 길드원이 존재하지 않습니다."));

        if (!actor.getGuild().getId().equals(owner.getGuild().getId())) {
            throw new IllegalStateException("다른 길드원의 방덱은 생성할 수 없습니다.");
        }

        boolean isSelf = actor.getId().equals(owner.getId());
        boolean isManager = actor.getRole() == GuildMemberRole.MASTER
                || actor.getRole() == GuildMemberRole.SUB_MASTER;

        if (!isSelf && !isManager) {
            throw new IllegalStateException("본인 또는 마스터/부마스터만 방덱을 생성할 수 있습니다.");
        }

        if (request.getMonsterCodes() == null || request.getMonsterCodes().size() != 3) {
            throw new IllegalArgumentException("방덱은 반드시 3마리 몬스터로 구성되어야 합니다.");
        }

        if (request.getMonsterCodes().stream().distinct().count() != 3) {
            throw new IllegalStateException("같은 몬스터를 중복해서 넣을 수 없습니다.");
        }

        List<Monster> monsters = request.getMonsterCodes().stream()
                .map(code -> monsterRepository.findByCode(code)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 CODE: " + code)))
                .toList();

        // 인벤 총 보유 수량과 이미 방덱에 사용 중인 수량을 비교한다.
        for (Monster monster : monsters) {
            GuildMemberInventory inv = inventoryRepository
                    .findForUpdate(owner, monster)
                    .orElseThrow(() -> new NotFoundException(
                            owner.getDisplayName() + " 인벤에 없는 몬스터: " + monster.getName()
                    ));

            long usedCount = defenseDeckRepository.countMonsterUsage(owner, monster);
            long usableQuantity = inv.getQuantity() - usedCount;

            if (usableQuantity <= 0) {
                throw new IllegalStateException(
                        monster.getName()
                                + " 보유 수량이 부족합니다. "
                                + "(총 보유: " + inv.getQuantity()
                                + ", 사용 중: " + usedCount
                                + ", 사용 가능: " + usableQuantity + ")"
                );
            }
        }

        DefenseDeck deck = new DefenseDeck(owner, monsters);
        defenseDeckRepository.save(deck);

        return deck.getId();
    }

    /**
     * 방덱 삭제
     *
     * 정책:
     * - 방덱 삭제 시 인벤 quantity를 복구하지 않는다.
     * - quantity는 총 보유량이고, 사용량은 방덱 개수로 계산하기 때문.
     */
    public void deleteDeck(Long deckId, String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        DefenseDeck deck = defenseDeckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundException("방덱이 존재하지 않습니다."));

        GuildMember owner = deck.getOwner();

        if (!actor.getGuild().getId().equals(owner.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 방덱은 삭제할 수 없습니다.");
        }

        boolean isSelf = actor.getId().equals(owner.getId());
        boolean isManager = actor.getRole() == GuildMemberRole.MASTER
                || actor.getRole() == GuildMemberRole.SUB_MASTER;

        if (!isSelf && !isManager) {
            throw new IllegalStateException("방덱을 삭제할 권한이 없습니다.");
        }

        defenseDeckRepository.delete(deck);
    }

    @Transactional(readOnly = true)
    public List<DefenseDeckResponse> getGuildDecks(
            String email,
            String monsterFilterCode,
            String leaderEffect,
            Long ownerMemberId
    ) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember me = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        Long guildId = me.getGuild().getId();

        List<DefenseDeck> decks = defenseDeckRepository.findByGuildIdWithOwnerAndMonsters(guildId);

        Stream<DefenseDeck> stream = decks.stream();

        if (ownerMemberId != null) {
            stream = stream.filter(d ->
                    d.getOwner().getId().equals(ownerMemberId));
        }

        if (monsterFilterCode != null && !monsterFilterCode.isBlank()) {
            stream = stream.filter(d ->
                    d.getMonsters().stream()
                            .anyMatch(m -> m.getCode().equals(monsterFilterCode))
            );
        }

        if (leaderEffect != null && !leaderEffect.isBlank()) {
            stream = stream.filter(d ->
                    d.getLeader().getLeaderEffectType() != null &&
                            d.getLeader().getLeaderEffectType().equals(leaderEffect)
            );
        }

        List<DefenseDeck> filtered = stream.toList();

        if (monsterFilterCode != null && !monsterFilterCode.isBlank()) {
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(
                            (DefenseDeck d) -> !d.getLeader().getCode().equals(monsterFilterCode)
                    ))
                    .toList();
        }

        return filtered.stream()
                .map(this::toResponse)
                .toList();
    }

    private DefenseDeckResponse toResponse(DefenseDeck deck) {
        return new DefenseDeckResponse(
                deck.getId(),
                deck.getOwner().getId(),
                deck.getOwner().getDisplayName(),
                deck.getLeader().getId(),
                deck.getLeader().getCode(),
                deck.getLeader().getName(),
                deck.getLeader().getLeaderEffectType(),
                deck.getMonsters().stream()
                        .map(m -> new DefenseDeckResponse.MonsterItem(
                                m.getId(),
                                m.getCode(),
                                m.getName()
                        ))
                        .toList()
        );
    }
}