package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.guild.GuildMember;
import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "defense_decks")
public class DefenseDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 방덱 소유자 (길드원)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_member_id", nullable = false)
    private GuildMember owner;

    // 방덱 몬스터 3마리 (순서 중요: 0번 = 리더)
    @ManyToMany
    @JoinTable(
            name = "defense_deck_monsters",
            joinColumns = @JoinColumn(name = "defense_deck_id"),
            inverseJoinColumns = @JoinColumn(name = "monster_id")
    )
    @OrderColumn(name = "position")
    private List<Monster> monsters;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected DefenseDeck() {}

    public DefenseDeck(GuildMember owner, List<Monster> monsters) {
        this.owner = owner;
        this.monsters = monsters;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public GuildMember getOwner() { return owner; }

    public List<Monster> getMonsters() { return monsters; }

    public Monster getLeader() {
        return monsters.get(0);
    }
}
