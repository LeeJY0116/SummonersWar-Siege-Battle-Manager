package com.sbm.siegebackend.domain.monster.dto;

public record MonsterResponse(
        Long id,
        String code,
        String name,
        String attribute,
        String leaderEffectType,
        String imageUrl,
        Integer naturalStars
) {}
