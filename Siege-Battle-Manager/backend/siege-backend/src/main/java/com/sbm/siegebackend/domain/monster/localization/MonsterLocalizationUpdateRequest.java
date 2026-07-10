package com.sbm.siegebackend.domain.monster.localization;

import java.util.List;

public record MonsterLocalizationUpdateRequest(
        Boolean enabled,
        String koreanName,
        List<String> aliases
) {
}
