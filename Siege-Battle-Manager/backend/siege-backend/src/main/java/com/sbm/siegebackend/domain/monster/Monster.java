package com.sbm.siegebackend.domain.monster;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Setter;

@Entity
@Table(name = "monsters")


public class Monster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 몬스터 이름 (예: '암 네오스톤 에이전트')
    @Column(nullable = false, unique = true, length = 100)
    private String code;    // json파일 monster id값

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MonsterAttribute attribute;

    // 리더 효과 타입(나중에 Enum으로 빼도 됨, 우선 문자열)
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

    public String getCode() { return code; }

    public Long getId() { return id; }

    public String getName() { return name; }

    public MonsterAttribute getAttribute() { return attribute; }

    public String getLeaderEffectType() { return leaderEffectType; }
}
