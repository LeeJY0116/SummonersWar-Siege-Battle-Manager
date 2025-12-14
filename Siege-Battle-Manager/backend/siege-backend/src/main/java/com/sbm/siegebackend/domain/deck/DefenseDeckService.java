package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.guild.*;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sbm.siegebackend.domain.deck.dto.DefenseDeckResponse;
import java.util.Comparator;
import java.util.stream.Stream;

import java.util.List;

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
     */
    public Long createDeck(Long ownerMemberId, String email, DefenseDeckCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        GuildMember owner = guildMemberRepository.findById(ownerMemberId)
                .orElseThrow(() -> new NotFoundException("대상 길드원이 존재하지 않습니다."));

        // 같은 길드인지 확인
        if (!actor.getGuild().getId().equals(owner.getGuild().getId())) {
            throw new IllegalStateException("다른 길드원의 방덱은 생성할 수 없습니다.");
        }

        // 권한 체크
        boolean isSelf = actor.getId().equals(owner.getId());
        boolean isManager = actor.getRole() == GuildMemberRole.MASTER
                || actor.getRole() == GuildMemberRole.SUB_MASTER;

        if (!isSelf && !isManager) {
            throw new IllegalStateException("본인 또는 마스터/부마스터만 방덱을 생성할 수 있습니다.");
        }

        // 몬스터 3개 체크
        if (request.getMonsterIds() == null || request.getMonsterIds().size() != 3) {
            throw new IllegalArgumentException("방덱은 반드시 3마리 몬스터로 구성되어야 합니다.");
        }

        // 몬스터 조회
        List<Monster> monsters = request.getMonsterIds().stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        // 🔥 인벤토리 수량 체크 + 차감
        for (Monster monster : monsters) {
            GuildMemberInventory inv = inventoryRepository
                    .findByGuildMemberAndMonster(owner, monster)
                    .orElseThrow(() -> new NotFoundException(
                            monster.getName() + " 보유 수량이 부족합니다."
                    ));

            if (inv.getQuantity() <= 0) {
                throw new IllegalStateException(monster.getName() + " 보유 수량이 부족합니다.");
            }

            inv.setQuantity(inv.getQuantity() - 1);
        }

        DefenseDeck deck = new DefenseDeck(owner, monsters);
        defenseDeckRepository.save(deck);

        return deck.getId();
    }

    /**
     * 방덱 삭제
     */
    public void deleteDeck(Long deckId, String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        DefenseDeck deck = defenseDeckRepository.findById(deckId)
                .orElseThrow(() -> new NotFoundException("방덱이 존재하지 않습니다."));

        GuildMember owner = deck.getOwner();

        // 같은 길드인지
        if (!actor.getGuild().getId().equals(owner.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 방덱은 삭제할 수 없습니다.");
        }

        // 권한
        boolean isSelf = actor.getId().equals(owner.getId());
        boolean isManager = actor.getRole() == GuildMemberRole.MASTER
                || actor.getRole() == GuildMemberRole.SUB_MASTER;

        if (!isSelf && !isManager) {
            throw new IllegalStateException("방덱을 삭제할 권한이 없습니다.");
        }

        // 🔥 인벤토리 복구
        for (Monster monster : deck.getMonsters()) {
            GuildMemberInventory inv = inventoryRepository
                    .findByGuildMemberAndMonster(owner, monster)
                    .orElseThrow();

            inv.setQuantity(inv.getQuantity() + 1);
        }

        defenseDeckRepository.delete(deck);
    }

    @Transactional(readOnly = true)
    public List<DefenseDeckResponse> getGuildDecks(
            String email,
            Long monsterFilterId,
            String leaderEffectFilter,
            Long ownerMemberFilterId
    ) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember me = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        Long guildId = me.getGuild().getId();

        List<DefenseDeck> decks = defenseDeckRepository.findByOwner_Guild_Id(guildId);

        Stream<DefenseDeck> stream = decks.stream();

        // 1️⃣ 길드원 필터
        if (ownerMemberFilterId != null) {
            stream = stream.filter(d ->
                    d.getOwner().getId().equals(ownerMemberFilterId));
        }

        // 2️⃣ 몬스터 포함 필터
        if (monsterFilterId != null) {
            stream = stream.filter(d ->
                    d.getMonsters().stream()
                            .anyMatch(m -> m.getId().equals(monsterFilterId))
            );
        }

        // 3️⃣ 리더 효과 필터
        if (leaderEffectFilter != null && !leaderEffectFilter.isBlank()) {
            stream = stream.filter(d ->
                    d.getLeader().getLeaderEffectType() != null &&
                            d.getLeader().getLeaderEffectType().equals(leaderEffectFilter)
            );
        }

        List<DefenseDeck> filtered = stream.toList();

        // 4️⃣ 정렬: 선택 몬스터가 리더인 덱 우선
        if (monsterFilterId != null) {
            filtered = filtered.stream()
                    .sorted(Comparator.comparing(
                            (DefenseDeck d) -> !d.getLeader().getId().equals(monsterFilterId)
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
                deck.getLeader().getName(),
                deck.getLeader().getLeaderEffectType(),
                deck.getMonsters().stream()
                        .map(m -> new DefenseDeckResponse.MonsterItem(
                                m.getId(),
                                m.getName()
                        ))
                        .toList()
        );
    }
}
