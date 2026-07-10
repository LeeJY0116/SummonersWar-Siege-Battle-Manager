package com.sbm.siegebackend.domain.monster.dto;

import java.util.List;

public record MonsterResponse(
        Long id,
        String code,
        String name,
        String koreanName,
        List<String> aliases,
        String attribute,
        String leaderEffectType,
        String imageUrl,
        Integer naturalStars
) {}
