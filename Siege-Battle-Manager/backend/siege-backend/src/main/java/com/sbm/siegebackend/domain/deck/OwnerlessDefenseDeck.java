package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.guild.Guild;
import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ownerless_defense_decks")
public class OwnerlessDefenseDeck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어느 길드의 템플릿인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_id", nullable = false)
    private Guild guild;

    // 템플릿 제목(선택)
    @Column(nullable = false, length = 100)
    private String title;

    // 몬스터 3마리(0번=리더)
    @ManyToMany
    @JoinTable(
            name = "ownerless_defense_deck_monsters",
            joinColumns = @JoinColumn(name = "ownerless_defense_deck_id"),
            inverseJoinColumns = @JoinColumn(name = "monster_id")
    )
    @OrderColumn(name = "position")
    private List<Monster> monsters;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected OwnerlessDefenseDeck() {}

    public OwnerlessDefenseDeck(Guild guild, String title, List<Monster> monsters) {
        this.guild = guild;
        this.title = title;
        this.monsters = monsters;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Guild getGuild() { return guild; }

    public String getTitle() { return title; }

    public List<Monster> getMonsters() { return monsters; }

    public Monster getLeader() { return monsters.get(0); }
}
