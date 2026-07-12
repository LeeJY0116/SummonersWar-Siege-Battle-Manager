package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "signup_requests")
public class SignupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String loginId;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 20)
    private String signupType;

    @Column(nullable = false, length = 50)
    private String guildName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GuildMemberStatus status = GuildMemberStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected SignupRequest() {
    }

    public SignupRequest(String loginId,
                         String email,
                         String passwordHash,
                         String nickname,
                         String signupType,
                         String guildName) {
        this.loginId = loginId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.signupType = signupType;
        this.guildName = guildName;
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

    public String getLoginId() { return loginId; }

    public String getEmail() { return email; }

    public String getPasswordHash() { return passwordHash; }

    public String getNickname() { return nickname; }

    public String getSignupType() { return signupType; }

    public String getGuildName() { return guildName; }

    public GuildMemberStatus getStatus() { return status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void changeStatus(GuildMemberStatus status) {
        this.status = status;
    }
}
