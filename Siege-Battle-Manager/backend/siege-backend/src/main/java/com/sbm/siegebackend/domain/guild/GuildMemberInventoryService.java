package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryItemResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryUpdateRequest;
import com.sbm.siegebackend.domain.deck.DefenseDeckRepository;
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
public class GuildMemberInventoryService {

    private final GuildMemberRepository guildMemberRepository;
    private final GuildMemberInventoryRepository inventoryRepository;
    private final MonsterRepository monsterRepository;
    private final UserService userService;
    private final DefenseDeckRepository defenseDeckRepository;

    public GuildMemberInventoryService(GuildMemberRepository guildMemberRepository,
                                       GuildMemberInventoryRepository inventoryRepository,
                                       MonsterRepository monsterRepository,
                                       UserService userService,
                                       DefenseDeckRepository defenseDeckRepository) {
        this.guildMemberRepository = guildMemberRepository;
        this.inventoryRepository = inventoryRepository;
        this.monsterRepository = monsterRepository;
        this.userService = userService;
        this.defenseDeckRepository = defenseDeckRepository;
    }

    /**
     * 특정 길드원의 인벤 조회
     */
    @Transactional(readOnly = true)
    public List<GuildMemberInventoryItemResponse> getInventory(Long guildMemberId, String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        GuildMember target = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("해당 길드원이 존재하지 않습니다."));

        // 같은 길드인지 확인
        if (!actor.getGuild().getId().equals(target.getGuild().getId())) {
            throw new IllegalStateException("다른 길드원의 인벤토리는 조회할 수 없습니다.");
        }

        List<GuildMemberInventory> list = inventoryRepository.findByGuildMember(target);

        return list.stream()
                .map(inv -> new GuildMemberInventoryItemResponse(
                        inv.getMonster().getId(),
                        inv.getMonster().getCode(),
                        inv.getMonster().getName(),
                        inv.getMonster().getAttribute().name(),
                        inv.getQuantity()
                ))
                .toList();
    }

    /**
     * 특정 길드원의 인벤 수정
     * - 자기 자신이거나
     * - 같은 길드의 MASTER / SUB_MASTER만 가능
     * - 전달된 목록으로 "전체 교체"하는 방식
     */
    public void updateInventory(Long guildMemberId, String email, GuildMemberInventoryUpdateRequest request) {

        User user = userService.findByEmailOrThrow(email);

        GuildMember actor = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));

        GuildMember target = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("해당 길드원이 존재하지 않습니다."));

        // 같은 길드인지 확인
        if (!actor.getGuild().getId().equals(target.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 인벤토리는 수정할 수 없습니다.");
        }

        // 권한 체크
        boolean isSelf = actor.getId().equals(target.getId());

        boolean isManager =
                actor.getRole() == GuildMemberRole.MASTER
                        || actor.getRole() == GuildMemberRole.SUB_MASTER;

        if (!isSelf && !isManager) {
            throw new IllegalStateException(
                    "본인 또는 길드 마스터/부마스터만 인벤토리를 수정할 수 있습니다."
            );
        }

        // 요청 없으면 빈 리스트 처리
        List<GuildMemberInventoryUpdateRequest.Item> items =
                request.getItems() == null
                        ? List.of()
                        : request.getItems();

        // -----------------------------
        // 1️⃣ 먼저 전체 검증
        // -----------------------------

        for (GuildMemberInventoryUpdateRequest.Item item : items) {

            if (item.getQuantity() < 0) {
                throw new IllegalArgumentException("수량은 음수가 될 수 없습니다.");
            }

            Monster monster = monsterRepository.findByCode(item.getMonsterCode())
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "존재하지 않는 몬스터 CODE: " + item.getMonsterCode()
                            )
                    );

            // 현재 방덱에서 사용 중인 개수
            long usedCount =
                    defenseDeckRepository.countMonsterUsage(target, monster);

            // 방덱 사용량보다 적게 줄이려는 경우 막기
            if (item.getQuantity() < usedCount) {

                throw new IllegalStateException(
                        monster.getName()
                                + "은 현재 방덱에 "
                                + usedCount
                                + "개 사용 중이라 "
                                + usedCount
                                + "개 미만으로 줄일 수 없습니다."
                );
            }
        }

        // -----------------------------
        // 2️⃣ 검증 통과 후 기존 인벤 삭제
        // -----------------------------

        List<GuildMemberInventory> existing =
                inventoryRepository.findByGuildMember(target);

        inventoryRepository.deleteAll(existing);

        inventoryRepository.flush();

        // -----------------------------
        // 3️⃣ 새 인벤 저장
        // -----------------------------

        for (GuildMemberInventoryUpdateRequest.Item item : items) {

            if (item.getQuantity() <= 0) {
                continue;
            }

            Monster monster = monsterRepository.findByCode(item.getMonsterCode())
                    .orElseThrow(() ->
                            new NotFoundException(
                                    "존재하지 않는 몬스터 CODE: "
                                            + item.getMonsterCode()
                            )
                    );

            GuildMemberInventory inv = new GuildMemberInventory(
                    target,
                    monster,
                    item.getQuantity()
            );

            inventoryRepository.save(inv);
        }
    }
}
