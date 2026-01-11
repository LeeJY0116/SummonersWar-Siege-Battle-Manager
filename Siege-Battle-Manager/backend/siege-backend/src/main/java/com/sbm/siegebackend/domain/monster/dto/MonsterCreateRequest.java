package com.sbm.siegebackend.domain.monster.dto;

public record MonsterCreateRequest(
        String name,
        String attribute,
        String leaderEffectType,
        String imageUrl
) {}
