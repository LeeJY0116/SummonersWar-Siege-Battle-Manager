package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 길드 엔티티
 */
@Entity
@Table(name = "guilds")
public class Guild {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 길드 이름 (유니크)
    @Column(nullable = false, unique = true, length = 50)
    private String name;

    // 길드 소개
    @Column(nullable = false, length = 255)
    private String description;

    // 길드 마스터
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id", nullable = false)
    private User master;

    // 길드 멤버들 (양방향: User.guild)
    @OneToMany(mappedBy = "guild")
    private List<GuildMember> members = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected Guild() {
    }

    public Guild(String name, String description, User master) {
        this.name = name;
        this.description = description;
        this.master = master;
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

    // 연관관계 편의 메서드
    public void addMember(GuildMember member) {
        members.add(member);
    }

    // --- getter ---

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public User getMaster() {
        return master;
    }

    public List<GuildMember> getMembers() {
        return members;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // --- setter (필요 최소한만) ---

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
