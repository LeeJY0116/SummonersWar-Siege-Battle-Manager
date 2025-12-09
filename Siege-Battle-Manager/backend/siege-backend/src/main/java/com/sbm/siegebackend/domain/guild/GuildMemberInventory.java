package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.*;

@Entity
@Table(
        name = "guild_member_inventories",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_guild_member_monster",
                        columnNames = {"guild_member_id", "monster_id"}
                )
        }
)
public class GuildMemberInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 길드원의 인벤인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guild_member_id", nullable = false)
    private GuildMember guildMember;

    // 어떤 몬스터인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monster_id", nullable = false)
    private Monster monster;

    // 보유 수량
    @Column(nullable = false)
    private int quantity;

    protected GuildMemberInventory() {}

    public GuildMemberInventory(GuildMember guildMember, Monster monster, int quantity) {
        this.guildMember = guildMember;
        this.monster = monster;
        this.quantity = quantity;
    }

    public Long getId() { return id; }

    public GuildMember getGuildMember() { return guildMember; }

    public Monster getMonster() { return monster; }

    public int getQuantity() { return quantity; }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
