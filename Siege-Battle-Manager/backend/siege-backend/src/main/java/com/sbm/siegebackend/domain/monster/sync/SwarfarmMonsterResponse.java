package com.sbm.siegebackend.domain.monster.sync;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SwarfarmMonsterResponse {

    private Long id;

    @JsonProperty("com2us_id")
    private Integer com2usId;

    private String name;

    @JsonProperty("image_filename")
    private String imageFilename;

    private String element;

    @JsonProperty("natural_stars")
    private Integer naturalStars;

    @JsonProperty("leader_skill")
    private SwarfarmLeaderSkillResponse leaderSkill;

    public Long getId() {
        return id;
    }

    public Integer getCom2usId() {
        return com2usId;
    }

    public String getName() {
        return name;
    }

    public String getImageFilename() {
        return imageFilename;
    }

    public String getElement() {
        return element;
    }

    public Integer getNaturalStars() {
        return naturalStars;
    }

    public SwarfarmLeaderSkillResponse getLeaderSkill() {
        return leaderSkill;
    }
}
