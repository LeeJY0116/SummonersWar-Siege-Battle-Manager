package com.sbm.siegebackend.domain.monster.dto;

import java.util.List;

public record MonsterResponse(
        Long id,
        String code,
        Integer com2usId,
        String name,
        String koreanName,
        List<String> aliases,
        String attribute,
        String leaderEffectType,
        Integer leaderEffectAmount,
        String leaderEffectArea,
        String leaderEffectElement,
        String leaderEffectText,
        String imageUrl,
        Integer naturalStars,
        Boolean enabled
) {}
