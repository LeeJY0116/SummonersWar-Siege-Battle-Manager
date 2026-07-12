package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "user_nickname_change_requests")
public class UserNicknameChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String previousNickname;

    @Column(nullable = false, length = 50)
    private String requestedNickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GuildMemberStatus status = GuildMemberStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected UserNicknameChangeRequest() {
    }

    public static UserNicknameChangeRequest create(User user, String requestedNickname) {
        UserNicknameChangeRequest request = new UserNicknameChangeRequest();
        request.user = user;
        request.previousNickname = user.getNickname();
        request.requestedNickname = requestedNickname;
        request.status = GuildMemberStatus.PENDING;
        return request;
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

    public User getUser() {
        return user;
    }

    public String getPreviousNickname() {
        return previousNickname;
    }

    public String getRequestedNickname() {
        return requestedNickname;
    }

    public GuildMemberStatus getStatus() {
        return status;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void approve(User reviewer) {
        this.status = GuildMemberStatus.APPROVED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
    }

    public void reject(User reviewer) {
        this.status = GuildMemberStatus.REJECTED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
    }
}
