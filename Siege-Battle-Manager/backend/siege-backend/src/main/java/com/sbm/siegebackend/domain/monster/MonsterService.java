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
                        m.getName(),
                        m.getAttribute().name(),
                        m.getLeaderEffectType()
                ))
                .toList();
    }

    public Long create(MonsterCreateRequest req) {
        monsterRepository.findByName(req.name()).ifPresent(m -> {
            throw new IllegalArgumentException("이미 존재하는 몬스터 이름입니다.");
        });

        MonsterAttribute attr = MonsterAttribute.valueOf(req.attribute());
        Monster saved = monsterRepository.save(new Monster(req.name(), attr, req.leaderEffectType()));
        return saved.getId();
    }
}
