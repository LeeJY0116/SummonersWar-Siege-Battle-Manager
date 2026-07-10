package com.sbm.siegebackend.domain.monster.localization;

import java.util.List;

public record MonsterLocalizationResponse(
        String code,
        Boolean enabled,
        Integer awakeningLevel,
        String englishName,
        String attribute,
        Integer naturalStars,
        String koreanName,
        List<String> aliases,
        String imageUrl
) {
}
