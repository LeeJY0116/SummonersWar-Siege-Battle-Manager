package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "battle_research_comments")
public class BattleResearchComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글은 게시글에 종속 → 게시글 삭제되면 댓글도 삭제돼야 함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private BattleResearchPost post;

    // 공덱(0~3마리)
    @ManyToMany
    @JoinTable(
            name = "battle_research_comment_monsters",
            joinColumns = @JoinColumn(name = "comment_id"),
            inverseJoinColumns = @JoinColumn(name = "monster_id")
    )
    @OrderColumn(name = "position")
    private List<Monster> attackMonsters;

    // 코멘트 내용
    @Column(nullable = false, length = 2000)
    private String content;

    // 작성자 정보 (FK X)
    @Column(nullable = true)
    private Long authorUserId;

    @Column(nullable = false, length = 50)
    private String authorName;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected BattleResearchComment() {}

    public BattleResearchComment(BattleResearchPost post,
                                 List<Monster> attackMonsters,
                                 String content,
                                 Long authorUserId,
                                 String authorName) {
        this.post = post;
        this.attackMonsters = attackMonsters;
        this.content = content;
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
    public BattleResearchPost getPost() { return post; }
    public List<Monster> getAttackMonsters() { return attackMonsters; }
    public String getContent() { return content; }
    public Long getAuthorUserId() { return authorUserId; }
    public String getAuthorName() { return authorName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void changeContent(String content) {
        this.content = content;
    }

    public void changeAttackMonsters(List<Monster> monsters) {
        this.attackMonsters = monsters;
    }
}
