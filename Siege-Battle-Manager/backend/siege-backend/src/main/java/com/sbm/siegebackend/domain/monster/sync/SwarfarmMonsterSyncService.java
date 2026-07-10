package com.sbm.siegebackend.domain.monster.sync;

import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterAttribute;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@Transactional
public class SwarfarmMonsterSyncService {

    private final MonsterRepository monsterRepository;
    private final RestClient restClient;
    private final String baseUrl;
    private final String imageBaseUrl;

    public SwarfarmMonsterSyncService(
            MonsterRepository monsterRepository,
            @Value("${external.swarfarm.base-url}") String baseUrl,
            @Value("${external.swarfarm.image-base-url}") String imageBaseUrl
    ) {
        this.monsterRepository = monsterRepository;
        this.restClient = RestClient.create();
        this.baseUrl = baseUrl;
        this.imageBaseUrl = imageBaseUrl;
    }

    public int syncMonsters() {
        int savedCount = 0;
        String nextUrl = baseUrl + "/monsters/?page_size=1000";

        while (nextUrl != null) {
            SwarfarmPageResponse<SwarfarmMonsterResponse> page =
                    restClient.get()
                            .uri(nextUrl)
                            .retrieve()
                            .body(new ParameterizedTypeReference<>() {});

            if (page == null || page.getResults() == null) {
                break;
            }

            savedCount += savePage(page.getResults());
            nextUrl = page.getNext();
        }

        return savedCount;
    }

    private int savePage(List<SwarfarmMonsterResponse> monsters) {
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

            monster.updateFromSwarfarm(
                    swarfarmMonster.getCom2usId(),
                    swarfarmMonster.getName(),
                    attribute,
                    swarfarmMonster.getNaturalStars(),
                    imageUrl
            );

            monsterRepository.save(monster);
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
