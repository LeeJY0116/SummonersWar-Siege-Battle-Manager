package com.sbm.siegebackend.domain.monster.dto;

public record MonsterResponse(
        Long id,
        String name,
        String attribute,
        String leaderEffectType
//        String leaderEffectText,
//        String imageUrl
) {}
