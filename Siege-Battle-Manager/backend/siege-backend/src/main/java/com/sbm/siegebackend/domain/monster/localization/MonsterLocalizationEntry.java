package com.sbm.siegebackend.domain.monster.localization;

import java.util.List;

public class MonsterLocalizationEntry {

    private Boolean enabled;
    private String englishName;
    private String attribute;
    private Integer naturalStars;
    private String koreanName;
    private List<String> aliases;

    public Boolean getEnabled() {
        return enabled;
    }

    public String getEnglishName() {
        return englishName;
    }

    public String getAttribute() {
        return attribute;
    }

    public Integer getNaturalStars() {
        return naturalStars;
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

    public void setEnglishName(String englishName) {
        this.englishName = englishName;
    }

    public void setAttribute(String attribute) {
        this.attribute = attribute;
    }

    public void setNaturalStars(Integer naturalStars) {
        this.naturalStars = naturalStars;
    }

    public void setKoreanName(String koreanName) {
        this.koreanName = koreanName;
    }

    public void setAliases(List<String> aliases) {
        this.aliases = aliases;
    }
}
