package com.sbm.siegebackend.domain.monster.localization;

import java.util.List;

public class MonsterLocalizationEntry {

    private Boolean enabled;
    private String koreanName;
    private List<String> aliases;

    public Boolean getEnabled() {
        return enabled;
    }

    public String getKoreanName() {
        return koreanName;
    }

    public List<String> getAliases() {
        return aliases;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public void setKoreanName(String koreanName) {
        this.koreanName = koreanName;
    }

    public void setAliases(List<String> aliases) {
        this.aliases = aliases;
    }
}
