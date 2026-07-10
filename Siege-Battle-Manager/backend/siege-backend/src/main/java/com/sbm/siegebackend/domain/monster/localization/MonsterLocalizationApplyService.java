package com.sbm.siegebackend.domain.monster.localization;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Service
@Transactional
public class MonsterLocalizationApplyService {

    private static final String LOCALIZATION_PATH = "data/monster-localization.json";

    private final MonsterRepository monsterRepository;
    private final ObjectMapper objectMapper;

    public MonsterLocalizationApplyService(MonsterRepository monsterRepository,
                                           ObjectMapper objectMapper) {
        this.monsterRepository = monsterRepository;
        this.objectMapper = objectMapper;
    }

    public int applyLocalization() {
        Map<String, MonsterLocalizationEntry> entries = readEntries();

        int appliedCount = 0;

        for (Map.Entry<String, MonsterLocalizationEntry> entry : entries.entrySet()) {
            String monsterCode = entry.getKey();
            MonsterLocalizationEntry localization = entry.getValue();

            if (monsterCode == null || monsterCode.isBlank() || localization == null) {
                continue;
            }

            Monster monster = monsterRepository.findByCode(monsterCode).orElse(null);

            if (monster == null) {
                continue;
            }

            monster.updateLocalization(
                    localization.getKoreanName(),
                    localization.getAliases(),
                    localization.getEnabled()
            );
            appliedCount++;
        }

        return appliedCount;
    }

    private Map<String, MonsterLocalizationEntry> readEntries() {
        Path sourcePath = Path.of("src", "main", "resources", "data", "monster-localization.json");

        if (Files.exists(sourcePath)) {
            try (InputStream inputStream = Files.newInputStream(sourcePath)) {
                return objectMapper.readValue(inputStream, new TypeReference<>() {});
            } catch (IOException e) {
                throw new IllegalStateException("몬스터 관리 파일을 읽을 수 없습니다: " + sourcePath, e);
            }
        }

        ClassPathResource resource = new ClassPathResource(LOCALIZATION_PATH);

        if (!resource.exists()) {
            throw new IllegalStateException("몬스터 관리 파일을 찾을 수 없습니다: " + LOCALIZATION_PATH);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<>() {});
        } catch (IOException e) {
            throw new IllegalStateException("몬스터 관리 파일을 읽을 수 없습니다.", e);
        }
    }
}
