package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 길드 내 한 명의 멤버 (실제 유저 + 가짜 유저 공통)
 */
@Entity
@Table(name = "guild_members")
public class GuildMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 길드에 속해 있는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_id", nullable = false)
    private Guild guild;

    // REAL이면 실제 User와 연결, VIRTUAL이면 null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 길드 내에서 보여지는 이름 (가짜 길드원도 이름 필요)
    @Column(nullable = false, length = 50)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuildMemberRole role; // MASTER / SUB_MASTER / MEMBER

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuildMemberType type; // REAL / VIRTUAL

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected GuildMember() {}

    private GuildMember(Guild guild,
                        User user,
                        String displayName,
                        GuildMemberRole role,
                        GuildMemberType type) {
        this.guild = guild;
        this.user = user;
        this.displayName = displayName;
        this.role = role;
        this.type = type;
    }

    public static GuildMember createReal(Guild guild, User user, GuildMemberRole role) {
        return new GuildMember(
                guild,
                user,
                user.getNickname(), // 기본적으로 유저 닉네임 사용
                role,
                GuildMemberType.REAL
        );
    }

    public static GuildMember createVirtual(Guild guild, String displayName, GuildMemberRole role) {
        return new GuildMember(
                guild,
                null,
                displayName,
                role,
                GuildMemberType.VIRTUAL
        );
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

    // --- getter ---

    public Long getId() { return id; }

    public Guild getGuild() { return guild; }

    public User getUser() { return user; }

    public String getDisplayName() { return displayName; }

    public GuildMemberRole getRole() { return role; }

    public GuildMemberType getType() { return type; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // --- business methods ---

    public void changeRole(GuildMemberRole role) {
        this.role = role;
    }

    public void changeDisplayName(String displayName) {
        this.displayName = displayName;
    }
}
