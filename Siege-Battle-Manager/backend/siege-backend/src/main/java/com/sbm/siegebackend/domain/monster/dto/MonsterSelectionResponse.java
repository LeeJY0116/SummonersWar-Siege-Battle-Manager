package com.sbm.siegebackend.domain.monster.dto;

import java.util.List;

public record MonsterSelectionResponse(
        String code,
        String name,
        String koreanName,
        List<String> aliases,
        String attribute,
        String leaderEffectType,
        Integer leaderEffectAmount,
        String leaderEffectArea,
        String leaderEffectElement,
        String imageUrl,
        Integer naturalStars
) {
}
