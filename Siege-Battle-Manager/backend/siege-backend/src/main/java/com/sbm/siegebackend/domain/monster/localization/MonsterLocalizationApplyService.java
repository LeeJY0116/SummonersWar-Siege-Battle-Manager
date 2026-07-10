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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class MonsterLocalizationApplyService {

    private static final String LOCALIZATION_PATH = "data/monster-localization.json";
    private static final Path SOURCE_LOCALIZATION_PATH =
            Path.of("src", "main", "resources", "data", "monster-localization.json");

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
        hideManagedMonstersMissingFromLocalization(entries);

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

    private void hideManagedMonstersMissingFromLocalization(Map<String, MonsterLocalizationEntry> entries) {
        for (Monster monster : monsterRepository.findAll()) {
            String code = monster.getCode();

            if (isManagedMonsterCode(code) && !entries.containsKey(code)) {
                monster.updateLocalization(monster.getKoreanName(), monster.getAliasList(), false);
            }
        }
    }

    private boolean isManagedMonsterCode(String code) {
        return code != null && (code.startsWith("sw_") || code.startsWith("def_"));
    }

    public int appendMissingEntries(List<Monster> monsters) {
        Map<String, MonsterLocalizationEntry> entries = readEntries();
        List<Monster> missingMonsters = new ArrayList<>();

        for (Monster monster : monsters) {
            if (monster.getCode() == null || entries.containsKey(monster.getCode())) {
                continue;
            }

            missingMonsters.add(monster);
        }

        if (missingMonsters.isEmpty()) {
            return 0;
        }

        for (Monster monster : missingMonsters) {
            entries.put(monster.getCode(), toEntry(monster));
        }

        writeSourceEntries(entries);
        return missingMonsters.size();
    }

    private MonsterLocalizationEntry toEntry(Monster monster) {
        MonsterLocalizationEntry entry = new MonsterLocalizationEntry();
        Integer awakeningLevel = calculateAwakeningLevel(monster.getCode());
        entry.setEnabled(false);
        entry.setAwakeningLevel(awakeningLevel);
        entry.setEnglishName(monster.getName());
        entry.setAttribute(monster.getAttribute() == null ? null : monster.getAttribute().name());
        entry.setNaturalStars(monster.getNaturalStars());
        entry.setKoreanName("");
        entry.setAliases(List.of());
        return entry;
    }

    private Integer calculateAwakeningLevel(String monsterCode) {
        if (monsterCode == null || !monsterCode.startsWith("sw_")) {
            return null;
        }

        try {
            int suffix = Integer.parseInt(monsterCode.substring(3)) % 100;

            if (suffix >= 1 && suffix <= 5) {
                return 0;
            }

            if (suffix >= 11 && suffix <= 15) {
                return 1;
            }

            if (suffix >= 31 && suffix <= 35) {
                return 2;
            }

            return null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, MonsterLocalizationEntry> readEntries() {
        if (Files.exists(SOURCE_LOCALIZATION_PATH)) {
            try (InputStream inputStream = Files.newInputStream(SOURCE_LOCALIZATION_PATH)) {
                return objectMapper.readValue(inputStream, new TypeReference<LinkedHashMap<String, MonsterLocalizationEntry>>() {});
            } catch (IOException e) {
                throw new IllegalStateException("몬스터 관리 파일을 읽을 수 없습니다: " + SOURCE_LOCALIZATION_PATH, e);
            }
        }

        ClassPathResource resource = new ClassPathResource(LOCALIZATION_PATH);

        if (!resource.exists()) {
            throw new IllegalStateException("몬스터 관리 파일을 찾을 수 없습니다: " + LOCALIZATION_PATH);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<LinkedHashMap<String, MonsterLocalizationEntry>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("몬스터 관리 파일을 읽을 수 없습니다.", e);
        }
    }

    private void writeSourceEntries(Map<String, MonsterLocalizationEntry> entries) {
        try {
            Files.createDirectories(SOURCE_LOCALIZATION_PATH.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(SOURCE_LOCALIZATION_PATH.toFile(), entries);
        } catch (IOException e) {
            throw new IllegalStateException("몬스터 관리 파일에 신규 항목을 추가할 수 없습니다: " + SOURCE_LOCALIZATION_PATH, e);
        }
    }
}
