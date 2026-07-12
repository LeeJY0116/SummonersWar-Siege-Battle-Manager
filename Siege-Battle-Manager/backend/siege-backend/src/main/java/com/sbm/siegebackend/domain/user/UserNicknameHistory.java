package com.sbm.siegebackend.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_nickname_histories")
public class UserNicknameHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    private String previousNickname;

    @Column(nullable = false, length = 50)
    private String newNickname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id")
    private User changedBy;

    @Column(nullable = false, length = 50)
    private String changeType;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected UserNicknameHistory() {
    }

    public static UserNicknameHistory initial(User user) {
        return create(user, null, user.getNickname(), null, "INITIAL");
    }

    public static UserNicknameHistory create(User user,
                                             String previousNickname,
                                             String newNickname,
                                             User changedBy,
                                             String changeType) {
        UserNicknameHistory history = new UserNicknameHistory();
        history.user = user;
        history.previousNickname = previousNickname;
        history.newNickname = newNickname;
        history.changedBy = changedBy;
        history.changeType = changeType;
        return history;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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

    public String getNewNickname() {
        return newNickname;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public String getChangeType() {
        return changeType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
