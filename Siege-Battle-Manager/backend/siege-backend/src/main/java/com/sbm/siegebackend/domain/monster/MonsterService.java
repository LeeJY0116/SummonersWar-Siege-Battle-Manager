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
                .map(m -> new MonsterResponse(
                        m.getId(),
                        m.getCode(),
                        m.getName(),
                        m.getKoreanName(),
                        m.getAliasList(),
                        m.getAttribute().name(),
                        m.getLeaderEffectType(),
                        m.getImageUrl(),
                        m.getNaturalStars()
                ))
                .toList();
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
