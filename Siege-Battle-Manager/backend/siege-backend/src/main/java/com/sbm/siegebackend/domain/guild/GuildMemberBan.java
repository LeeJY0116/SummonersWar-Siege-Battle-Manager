package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "guild_member_bans")
public class GuildMemberBan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_id", nullable = false)
    private Guild guild;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String loginIdSnapshot;

    @Column(nullable = false, length = 50)
    private String nicknameSnapshot;

    @Column(length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_by_user_id", nullable = false)
    private User bannedBy;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lifted_by_user_id")
    private User liftedBy;

    private LocalDateTime liftedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected GuildMemberBan() {
    }

    public static GuildMemberBan create(Guild guild, User user, String nicknameSnapshot, User bannedBy, String reason) {
        GuildMemberBan ban = new GuildMemberBan();
        ban.guild = guild;
        ban.user = user;
        ban.loginIdSnapshot = user.getLoginId();
        ban.nicknameSnapshot = nicknameSnapshot;
        ban.bannedBy = bannedBy;
        ban.reason = reason;
        ban.active = true;
        return ban;
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

    public Long getId() {
        return id;
    }

    public Guild getGuild() {
        return guild;
    }

    public User getUser() {
        return user;
    }

    public String getLoginIdSnapshot() {
        return loginIdSnapshot;
    }

    public String getNicknameSnapshot() {
        return nicknameSnapshot;
    }

    public String getReason() {
        return reason;
    }

    public User getBannedBy() {
        return bannedBy;
    }

    public boolean isActive() {
        return active;
    }

    public User getLiftedBy() {
        return liftedBy;
    }

    public LocalDateTime getLiftedAt() {
        return liftedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void lift(User liftedBy) {
        this.active = false;
        this.liftedBy = liftedBy;
        this.liftedAt = LocalDateTime.now();
    }
}
