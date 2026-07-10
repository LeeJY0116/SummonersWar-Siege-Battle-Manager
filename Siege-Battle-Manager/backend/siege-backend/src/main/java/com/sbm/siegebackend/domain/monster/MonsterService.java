package com.sbm.siegebackend.domain.monster;

import com.sbm.siegebackend.domain.monster.dto.MonsterCreateRequest;
import com.sbm.siegebackend.domain.monster.dto.MonsterResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MonsterService {

    private final MonsterRepository monsterRepository;

    @Transactional(readOnly = true)
    public List<MonsterResponse> getAll() {
        return monsterRepository.findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getEnabled()))
                .map(m -> new MonsterResponse(
                        m.getId(),
                        m.getCode(),
                        m.getCom2usId(),
                        m.getName(),
                        m.getKoreanName(),
                        m.getAliasList(),
                        m.getAttribute().name(),
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
        return saved.getId();
    }
}
