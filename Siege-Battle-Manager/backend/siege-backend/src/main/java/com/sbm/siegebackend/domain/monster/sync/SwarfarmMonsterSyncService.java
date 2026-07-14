package com.sbm.siegebackend.domain.monster.sync;

import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterAttribute;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.monster.localization.MonsterLocalizationApplyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataAccessException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class SwarfarmMonsterSyncService {

    private static final Logger log = LoggerFactory.getLogger(SwarfarmMonsterSyncService.class);

    private final MonsterRepository monsterRepository;
    private final MonsterLocalizationApplyService localizationApplyService;
    private final TransactionTemplate transactionTemplate;
    private final RestClient restClient;
    private final String baseUrl;
    private final String imageBaseUrl;
    private final int pageSize;
    private final boolean appendMissingLocalization;

    public SwarfarmMonsterSyncService(
            MonsterRepository monsterRepository,
            MonsterLocalizationApplyService localizationApplyService,
            TransactionTemplate transactionTemplate,
            @Value("${external.swarfarm.base-url}") String baseUrl,
            @Value("${external.swarfarm.image-base-url}") String imageBaseUrl,
            @Value("${external.swarfarm.page-size:200}") int pageSize,
            @Value("${external.swarfarm.connect-timeout-seconds:10}") int connectTimeoutSeconds,
            @Value("${external.swarfarm.read-timeout-seconds:30}") int readTimeoutSeconds,
            @Value("${external.swarfarm.append-missing-localization:false}") boolean appendMissingLocalization
    ) {
        this.monsterRepository = monsterRepository;
        this.localizationApplyService = localizationApplyService;
        this.transactionTemplate = transactionTemplate;
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory(connectTimeoutSeconds, readTimeoutSeconds))
                .build();
        this.baseUrl = baseUrl;
        this.imageBaseUrl = imageBaseUrl;
        this.pageSize = pageSize;
        this.appendMissingLocalization = appendMissingLocalization;
    }

    public int syncMonsters() {
        int savedCount = 0;
        List<Monster> syncedMonsters = new ArrayList<>();
        String nextUrl = baseUrl + "/monsters/?page_size=" + pageSize;
        int pageNumber = 1;

        while (nextUrl != null) {
            SwarfarmPageResponse<SwarfarmMonsterResponse> page = fetchPage(nextUrl, pageNumber);

            if (page == null || page.getResults() == null) {
                break;
            }

            int pageSavedCount = savePageInTransaction(page.getResults(), syncedMonsters, pageNumber);
            savedCount += pageSavedCount;
            log.info("Swarfarm monster sync page {} saved {} monsters. total={}", pageNumber, pageSavedCount, savedCount);
            nextUrl = page.getNext();
            pageNumber++;
        }

        if (appendMissingLocalization) {
            localizationApplyService.appendMissingEntries(syncedMonsters);
        }

        return savedCount;
    }

    private SwarfarmPageResponse<SwarfarmMonsterResponse> fetchPage(String nextUrl, int pageNumber) {
        try {
            return restClient.get()
                    .uri(nextUrl)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (RestClientException e) {
            log.error("Failed to fetch Swarfarm monster page {}. url={}", pageNumber, nextUrl, e);
            throw new SwarfarmSyncException("Swarfarm API 호출에 실패했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }

    private int savePageInTransaction(List<SwarfarmMonsterResponse> monsters,
                                      List<Monster> syncedMonsters,
                                      int pageNumber) {
        try {
            Integer savedCount = transactionTemplate.execute(status -> savePage(monsters, syncedMonsters));
            return savedCount == null ? 0 : savedCount;
        } catch (DataAccessException e) {
            log.error("Failed to save Swarfarm monster page {}. size={}", pageNumber, monsters.size(), e);
            throw new SwarfarmSyncException("Swarfarm 몬스터 저장 중 DB 오류가 발생했습니다. 서버 로그를 확인해주세요.", e);
        }
    }

    private SimpleClientHttpRequestFactory requestFactory(int connectTimeoutSeconds, int readTimeoutSeconds) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds));
        factory.setReadTimeout(Duration.ofSeconds(readTimeoutSeconds));
        return factory;
    }

    private int savePage(List<SwarfarmMonsterResponse> monsters, List<Monster> syncedMonsters) {
        int count = 0;

        for (SwarfarmMonsterResponse swarfarmMonster : monsters) {
            if (swarfarmMonster.getCom2usId() == null) {
                continue;
            }

            MonsterAttribute attribute = toAttribute(swarfarmMonster.getElement());

            if (attribute == null) {
                continue;
            }

            String code = buildCode(swarfarmMonster.getCom2usId());
            String imageUrl = buildImageUrl(swarfarmMonster.getImageFilename());

            Monster monster = findExistingMonster(swarfarmMonster.getCom2usId(), code);
            SwarfarmLeaderSkillResponse leaderSkill = swarfarmMonster.getLeaderSkill();

            monster.updateFromSwarfarm(
                    swarfarmMonster.getCom2usId(),
                    swarfarmMonster.getName(),
                    attribute,
                    swarfarmMonster.getNaturalStars(),
                    imageUrl,
                    leaderSkill == null ? null : leaderSkill.getAttribute(),
                    leaderSkill == null ? null : leaderSkill.getAmount(),
                    leaderSkill == null ? null : leaderSkill.getArea(),
                    leaderSkill == null ? null : leaderSkill.getElement()
            );

            monsterRepository.save(monster);
            syncedMonsters.add(monster);
            count++;
        }

        return count;
    }

    private String buildCode(Integer com2usId) {
        return "sw_" + com2usId;
    }

    private Monster findExistingMonster(Integer com2usId, String code) {
        return monsterRepository.findByCom2usId(com2usId)
                .or(() -> monsterRepository.findByCode(code))
                .orElseGet(() -> Monster.builder()
                        .code(code)
                        .name(code)
                        .attribute(MonsterAttribute.FIRE)
                        .leaderEffectType(null)
                        .build());
    }

    private String buildImageUrl(String imageFilename) {
        if (imageFilename == null || imageFilename.isBlank()) {
            return null;
        }

        return imageBaseUrl + "/" + imageFilename;
    }

    private MonsterAttribute toAttribute(String element) {
        if (element == null) {
            return null;
        }

        return switch (element.toLowerCase()) {
            case "fire" -> MonsterAttribute.FIRE;
            case "water" -> MonsterAttribute.WATER;
            case "wind" -> MonsterAttribute.WIND;
            case "light" -> MonsterAttribute.LIGHT;
            case "dark" -> MonsterAttribute.DARK;
            default -> null;
        };
    }
}
