package com.sbm.siegebackend.domain.monster;

import jakarta.persistence.*;
import lombok.Builder;

@Entity
@Table(name = "monsters")
public class Monster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Integer com2usId;

    @Column(length = 500)
    private String imageUrl;

    private Integer naturalStars;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MonsterAttribute attribute;

    @Column(nullable = true, length = 50)
    private String leaderEffectType;

    protected Monster() {}

    @Builder
    public Monster(String code, String name, MonsterAttribute attribute, String leaderEffectType) {
        this.code = code;
        this.name = name;
        this.attribute = attribute;
        this.leaderEffectType = leaderEffectType;
    }

    public void updateFromSwarfarm(Integer com2usId,
                                   String name,
                                   MonsterAttribute attribute,
                                   Integer naturalStars,
                                   String imageUrl) {
        this.com2usId = com2usId;
        this.name = name;
        this.attribute = attribute;
        this.naturalStars = naturalStars;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }

    public String getCode() { return code; }

    public String getName() { return name; }

    public MonsterAttribute getAttribute() { return attribute; }

    public String getLeaderEffectType() { return leaderEffectType; }

    public Integer getCom2usId() { return com2usId; }

    public String getImageUrl() { return imageUrl; }

    public Integer getNaturalStars() { return naturalStars; }
}