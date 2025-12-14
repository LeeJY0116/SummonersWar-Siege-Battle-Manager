package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.guild.Guild;
import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "battle_research_posts")
public class BattleResearchPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 길드 게시판이므로 guild는 FK로 묶는다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_id", nullable = false)
    private Guild guild;

    // 제목
    @Column(nullable = false, length = 100)
    private String title;

    // 방덱 3마리(0번=리더)
    @ManyToMany
    @JoinTable(
            name = "battle_research_post_monsters",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "monster_id")
    )
    @OrderColumn(name = "position")
    private List<Monster> defenseMonsters;

    // 작성자 정보 (절대 FK로 묶지 않음)
    @Column(nullable = true)
    private Long authorUserId; // REAL 유저면 값 있음, 아니면 null

    @Column(nullable = false, length = 50)
    private String authorName; // 스냅샷 (탈퇴해도 유지)

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected BattleResearchPost() {}

    public BattleResearchPost(Guild guild,
                              String title,
                              List<Monster> defenseMonsters,
                              Long authorUserId,
                              String authorName) {
        this.guild = guild;
        this.title = title;
        this.defenseMonsters = defenseMonsters;
        this.authorUserId = authorUserId;
        this.authorName = authorName;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Guild getGuild() { return guild; }
    public String getTitle() { return title; }
    public List<Monster> getDefenseMonsters() { return defenseMonsters; }
    public Long getAuthorUserId() { return authorUserId; }
    public String getAuthorName() { return authorName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeDefenseMonsters(List<Monster> monsters) {
        this.defenseMonsters = monsters;
    }
}
