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
        List<Monster> managedMonsters = monsterRepository.findAll().stream()
                .filter(monster -> isManagedMonsterCode(monster.getCode()))
                .toList();
        List<Monster> monstersToSave = new ArrayList<>();

        for (Monster monster : managedMonsters) {
            String monsterCode = monster.getCode();
            MonsterLocalizationEntry localization = entries.get(monsterCode);

            if (localization == null) {
                monster.updateLocalization(monster.getKoreanName(), monster.getAliasList(), false);
                monstersToSave.add(monster);
                continue;
            }

            monster.updateLocalization(
                    localization.getKoreanName(),
                    localization.getAliases(),
                    localization.getEnabled()
            );
            monstersToSave.add(monster);
        }

        monsterRepository.saveAll(monstersToSave);
        return monstersToSave.size();
    }

    @Transactional(readOnly = true)
    public List<MonsterLocalizationResponse> getLocalizationEntries() {
        Map<String, MonsterLocalizationEntry> entries = readEntries();
        Map<String, Monster> monstersByCode = getMonstersByCode();

        return entries.entrySet().stream()
                .map(entry -> toResponse(entry.getKey(), entry.getValue(), monstersByCode.get(entry.getKey())))
                .toList();
    }

    private Map<String, Monster> getMonstersByCode() {
        Map<String, Monster> monstersByCode = new LinkedHashMap<>();

        for (Monster monster : monsterRepository.findAll()) {
            String code = monster.getCode();

            if (code == null || code.isBlank()) {
                continue;
            }

            monstersByCode.putIfAbsent(code, monster);
        }

        return monstersByCode;
    }

    public MonsterLocalizationResponse updateLocalizationEntry(
            String monsterCode,
            MonsterLocalizationUpdateRequest request
    ) {
        Map<String, MonsterLocalizationEntry> entries = readEntries();
        MonsterLocalizationEntry entry = entries.get(monsterCode);

        if (entry == null) {
            throw new IllegalArgumentException("Monster localization entry not found: " + monsterCode);
        }

        entry.setEnabled(request.enabled());
        entry.setKoreanName(request.koreanName());
        entry.setAliases(normalizeAliases(request.aliases()));

        writeSourceEntries(entries);

        Monster monster = monsterRepository.findByCode(monsterCode).orElse(null);
        if (monster != null) {
            monster.updateLocalization(entry.getKoreanName(), entry.getAliases(), entry.getEnabled());
        }

        return toResponse(monsterCode, entry, monster);
    }

    private List<String> normalizeAliases(List<String> aliases) {
        if (aliases == null) {
            return List.of();
        }

        return aliases.stream()
                .map(alias -> alias == null ? "" : alias.trim())
                .filter(alias -> !alias.isBlank())
                .distinct()
                .toList();
    }

    private MonsterLocalizationResponse toResponse(String code, MonsterLocalizationEntry entry, Monster monster) {
        return new MonsterLocalizationResponse(
                code,
                entry.getEnabled(),
                entry.getAwakeningLevel(),
                entry.getEnglishName(),
                entry.getAttribute(),
                entry.getNaturalStars(),
                entry.getKoreanName(),
                entry.getAliases() == null ? List.of() : entry.getAliases(),
                monster == null ? null : monster.getImageUrl()
        );
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
                throw new IllegalStateException("\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: " + SOURCE_LOCALIZATION_PATH, e);
            }
        }

        ClassPathResource resource = new ClassPathResource(LOCALIZATION_PATH);

        if (!resource.exists()) {
            throw new IllegalStateException("\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: " + LOCALIZATION_PATH);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<LinkedHashMap<String, MonsterLocalizationEntry>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", e);
        }
    }

    private void writeSourceEntries(Map<String, MonsterLocalizationEntry> entries) {
        try {
            Files.createDirectories(SOURCE_LOCALIZATION_PATH.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(SOURCE_LOCALIZATION_PATH.toFile(), entries);
        } catch (IOException e) {
            throw new IllegalStateException("\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uD30C\uC77C\uC744 \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: " + SOURCE_LOCALIZATION_PATH, e);
        }
    }

}
