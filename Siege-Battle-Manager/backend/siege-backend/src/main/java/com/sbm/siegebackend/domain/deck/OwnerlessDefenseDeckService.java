package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckDetailResponse;
import com.sbm.siegebackend.domain.guild.*;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class OwnerlessDefenseDeckService {

    private final OwnerlessDefenseDeckRepository ownerlessRepo;
    private final GuildMemberRepository guildMemberRepository;
    private final GuildMemberInventoryRepository inventoryRepository;
    private final MonsterRepository monsterRepository;
    private final UserService userService;

    public OwnerlessDefenseDeckService(OwnerlessDefenseDeckRepository ownerlessRepo,
                                       GuildMemberRepository guildMemberRepository,
                                       GuildMemberInventoryRepository inventoryRepository,
                                       MonsterRepository monsterRepository,
                                       UserService userService) {
        this.ownerlessRepo = ownerlessRepo;
        this.guildMemberRepository = guildMemberRepository;
        this.inventoryRepository = inventoryRepository;
        this.monsterRepository = monsterRepository;
        this.userService = userService;
    }

    public Long create(String email, OwnerlessDefenseDeckCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        // 권한: 마스터/부마스터만
        if (actor.getRole() == GuildMemberRole.MEMBER) {
            throw new IllegalStateException("마스터/부마스터만 주인 없는 방덱을 생성할 수 있습니다.");
        }

        if (request.getMonsterIds() == null || request.getMonsterIds().size() != 3) {
            throw new IllegalArgumentException("방덱은 3마리 몬스터로 구성되어야 합니다.");
        }

        List<Monster> monsters = request.getMonsterIds().stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        OwnerlessDefenseDeck deck = new OwnerlessDefenseDeck(
                actor.getGuild(),
                request.getTitle() == null ? "주인 없는 방덱" : request.getTitle(),
                monsters
        );

        ownerlessRepo.save(deck);
        return deck.getId();
    }

    @Transactional(readOnly = true)
    public OwnerlessDefenseDeckDetailResponse getDetail(String email, Long deckId) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        OwnerlessDefenseDeck deck = ownerlessRepo.findById(deckId)
                .orElseThrow(() -> new NotFoundException("주인 없는 방덱이 존재하지 않습니다."));

        if (!deck.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 방덱은 조회할 수 없습니다.");
        }

        List<GuildMember> members = guildMemberRepository.findByGuild(actor.getGuild());
        List<Monster> monsters = deck.getMonsters();

        // ✅ 가능한 길드원 계산
        List<OwnerlessDefenseDeckDetailResponse.AvailableMember> available = members.stream()
                .filter(m -> canBuild(m, monsters))
                .map(m -> new OwnerlessDefenseDeckDetailResponse.AvailableMember(
                        m.getId(),
                        m.getDisplayName(),
                        m.getType().name()
                ))
                .toList();

        return new OwnerlessDefenseDeckDetailResponse(
                deck.getId(),
                deck.getTitle(),
                deck.getLeader().getId(),
                deck.getLeader().getName(),
                deck.getMonsters().stream()
                        .map(mm -> new OwnerlessDefenseDeckDetailResponse.MonsterItem(mm.getId(), mm.getName()))
                        .toList(),
                available.size(),
                available
        );
    }

    private boolean canBuild(GuildMember member, List<Monster> monsters) {
        for (Monster monster : monsters) {
            GuildMemberInventory inv = inventoryRepository.findByGuildMemberAndMonster(member, monster)
                    .orElse(null);
            if (inv == null || inv.getQuantity() < 1) {
                return false;
            }
        }
        return true;
    }

    public void delete(String email, Long deckId) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        // 권한: 마스터/부마스터만
        if (actor.getRole() == GuildMemberRole.MEMBER) {
            throw new IllegalStateException("마스터/부마스터만 삭제할 수 있습니다.");
        }

        OwnerlessDefenseDeck deck = ownerlessRepo.findById(deckId)
                .orElseThrow(() -> new NotFoundException("주인 없는 방덱이 존재하지 않습니다."));

        if (!deck.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 방덱은 삭제할 수 없습니다.");
        }

        ownerlessRepo.delete(deck);
    }
}
