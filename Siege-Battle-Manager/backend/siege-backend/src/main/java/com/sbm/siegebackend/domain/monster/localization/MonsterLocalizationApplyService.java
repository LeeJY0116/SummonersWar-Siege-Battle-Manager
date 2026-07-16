package com.sbm.siegebackend.domain.monster.localization;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.monster.MonsterService;
import com.sbm.siegebackend.domain.monster.sync.MonsterAdminJobService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MonsterLocalizationApplyService {

    private static final String LOCALIZATION_PATH = "data/monster-localization.json";
    private static final int APPLY_BATCH_SIZE = 100;
    private static final Path SOURCE_LOCALIZATION_PATH =
            Path.of("src", "main", "resources", "data", "monster-localization.json");

    private final MonsterRepository monsterRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final MonsterAdminJobService jobService;
    private final MonsterService monsterService;

    public MonsterLocalizationApplyService(MonsterRepository monsterRepository,
                                           ObjectMapper objectMapper,
                                           TransactionTemplate transactionTemplate,
                                           MonsterAdminJobService jobService,
                                           MonsterService monsterService) {
        this.monsterRepository = monsterRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = transactionTemplate;
        this.jobService = jobService;
        this.monsterService = monsterService;
    }

    public int applyLocalization() {
        Map<String, MonsterLocalizationEntry> entries = readEntries();
        List<String> managedCodes = monsterRepository.findManagedCodes();
        int appliedCount = 0;

        for (int start = 0; start < managedCodes.size(); start += APPLY_BATCH_SIZE) {
            int end = Math.min(start + APPLY_BATCH_SIZE, managedCodes.size());
            List<String> batchCodes = managedCodes.subList(start, end);
            int batchAppliedCount = applyBatch(entries, batchCodes);
            appliedCount += batchAppliedCount;
            jobService.updateProgress("몬스터 도감 정보 적용 중입니다.", appliedCount, managedCodes.size());
        }

        monsterService.clearMonsterCaches();
        return appliedCount;
    }

    private int applyBatch(Map<String, MonsterLocalizationEntry> entries, List<String> batchCodes) {
        return transactionTemplate.execute(status -> {
            List<Monster> monstersToSave = new ArrayList<>();

            for (Monster monster : monsterRepository.findAllByCodeIn(batchCodes)) {
                MonsterLocalizationEntry localization = entries.get(monster.getCode());

                if (localization == null) {
                    monster.updateLocalization(monster.getKoreanName(), monster.getAliasList(), false);
                } else {
                    monster.updateLocalization(
                            localization.getKoreanName(),
                            localization.getAliases(),
                            localization.getEnabled()
                    );
                }

                monstersToSave.add(monster);
            }

            monsterRepository.saveAll(monstersToSave);
            return monstersToSave.size();
        });
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
            monsterService.clearMonsterCaches();
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
