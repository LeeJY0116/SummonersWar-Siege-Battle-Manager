package com.sbm.siegebackend.domain.monster;

import com.sbm.siegebackend.domain.monster.dto.MonsterCreateRequest;
import com.sbm.siegebackend.domain.monster.dto.MonsterResponse;
import com.sbm.siegebackend.domain.monster.dto.MonsterSelectionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MonsterService {

    private final MonsterRepository monsterRepository;
    private volatile List<MonsterResponse> allMonsterCache;
    private volatile List<MonsterSelectionResponse> selectionMonsterCache;

    @Transactional(readOnly = true)
    public List<MonsterResponse> getAll() {
        List<MonsterResponse> cached = allMonsterCache;
        if (cached != null) {
            return cached;
        }

        synchronized (this) {
            if (allMonsterCache == null) {
                allMonsterCache = loadAllMonsters();
            }

            return allMonsterCache;
        }
    }

    @Transactional(readOnly = true)
    public List<MonsterSelectionResponse> getSelectionMonsters() {
        List<MonsterSelectionResponse> cached = selectionMonsterCache;
        if (cached != null) {
            return cached;
        }

        synchronized (this) {
            if (selectionMonsterCache == null) {
                selectionMonsterCache = loadSelectionMonsters();
            }

            return selectionMonsterCache;
        }
    }

    public void clearMonsterCaches() {
        allMonsterCache = null;
        selectionMonsterCache = null;
    }

    private List<MonsterResponse> loadAllMonsters() {
        return monsterRepository.findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getEnabled()))
                .map(m -> new MonsterResponse(
                        m.getId(),
                        m.getCode(),
                        m.getCom2usId(),
                        m.getName(),
                        m.getKoreanName(),
                        m.getAliasList(),
                        getAttributeName(m),
                        m.getLeaderEffectType(),
                        m.getLeaderEffectAmount(),
                        m.getLeaderEffectArea(),
                        m.getLeaderEffectElement(),
                        buildLeaderEffectText(m),
                        m.getImageUrl(),
                        m.getNaturalStars(),
                        m.getEnabled()
                ))
                .toList();
    }

    private List<MonsterSelectionResponse> loadSelectionMonsters() {
        return monsterRepository.findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getEnabled()))
                .map(m -> new MonsterSelectionResponse(
                        m.getCode(),
                        m.getName(),
                        m.getKoreanName(),
                        m.getAliasList(),
                        getAttributeName(m),
                        m.getLeaderEffectType(),
                        m.getLeaderEffectAmount(),
                        m.getLeaderEffectArea(),
                        m.getLeaderEffectElement(),
                        m.getImageUrl(),
                        m.getNaturalStars()
                ))
                .toList();
    }

    private String getAttributeName(Monster monster) {
        return monster.getAttribute() == null ? null : monster.getAttribute().name();
    }

    private String buildLeaderEffectText(Monster monster) {
        if (monster.getLeaderEffectType() == null || monster.getLeaderEffectType().isBlank()) {
            return "";
        }

        StringBuilder text = new StringBuilder();

        if (monster.getLeaderEffectArea() != null && !monster.getLeaderEffectArea().isBlank()) {
            text.append(monster.getLeaderEffectArea()).append(" ");
        }

        if (monster.getLeaderEffectElement() != null && !monster.getLeaderEffectElement().isBlank()) {
            text.append(monster.getLeaderEffectElement()).append(" ");
        }

        text.append(monster.getLeaderEffectType());

        if (monster.getLeaderEffectAmount() != null) {
            text.append(" ").append(monster.getLeaderEffectAmount()).append("%");
        }

        return text.toString();
    }

    public Long create(MonsterCreateRequest req) {
        monsterRepository.findByCode(req.code()).ifPresent(m -> {
            throw new IllegalArgumentException("이미 존재하는 몬스터 코드입니다.");
        });

        MonsterAttribute attr = MonsterAttribute.valueOf(req.attribute().toUpperCase());
        Monster saved = monsterRepository.save(
                Monster.builder()
                        .code(req.code())
                        .name(req.name())
                        .attribute(attr)
                        .leaderEffectType(req.leaderEffectType())
                        .build()
        );
        clearMonsterCaches();
        return saved.getId();
    }
}
