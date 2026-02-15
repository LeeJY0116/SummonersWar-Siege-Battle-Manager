package com.sbm.siegebackend.domain.monster;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
//@Profile("dev") // dev 프로필에서만 자동 적재 (원하면 제거)
public class MonsterSeeder implements CommandLineRunner {

    private final MonsterRepository monsterRepository;
    private final ObjectMapper objectMapper;

    public MonsterSeeder(MonsterRepository monsterRepository, ObjectMapper objectMapper) {
        this.monsterRepository = monsterRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        // 이미 데이터 있으면 스킵 (원하면 항상 upsert 하도록 바꿀 수 있음)
        if (monsterRepository.count() > 0) return;

        ClassPathResource resource = new ClassPathResource("data/defaultMonsters.json");

        try (InputStream is = resource.getInputStream()) {
            // ✅ 속성별 구조: { "fire": [ ... ], "water": [ ... ], ... }
            Map<String, List<MonsterSeedDto>> grouped =
                    objectMapper.readValue(is, new TypeReference<>() {});

            int inserted = 0;

            for (Map.Entry<String, List<MonsterSeedDto>> entry : grouped.entrySet()) {
                List<MonsterSeedDto> list = entry.getValue();
                if (list == null) continue;

                for (MonsterSeedDto dto : list) {
                    if (dto == null || dto.id == null || dto.id.isBlank()) continue;

                    // code가 PK 역할 (중복 방지)
                    if (monsterRepository.findByCode(dto.id).isPresent()) continue;
                    // 2) (임시 방어) name unique가 걸려있다면 name도 중복 방지
                    if (dto.name != null && monsterRepository.findByName(dto.name).isPresent()) continue;

                    Monster m = Monster.builder()
                            .code(dto.id)
                            .name(dto.name)
                            .attribute(MonsterAttribute.valueOf(dto.element.toUpperCase())) // ✅ Enum 변환
                            .leaderEffectType(null) // JSON에 없으면 null
                            .build();
                    // 필요하면 추가 필드도 여기에 세팅 (element/grade/sequence 등)
                    monsterRepository.save(m);

                    inserted++;
                }
            }

            System.out.println("[MonsterSeeder] inserted=" + inserted);
        }
    }

    // JSON에서 필요한 최소 필드만
    public static class MonsterSeedDto {
        public String id;
        public String name;
        public String element; // fire/water/...
        public String leaderEffectType; // "방어력" 등
    }
}
