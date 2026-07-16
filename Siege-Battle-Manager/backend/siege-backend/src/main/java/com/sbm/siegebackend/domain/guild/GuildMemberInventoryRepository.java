package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.monster.Monster;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GuildMemberInventoryRepository extends JpaRepository<GuildMemberInventory, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select i from GuildMemberInventory i
        join fetch i.monster m
        where i.guildMember = :member and i.monster = :monster
    """)
    Optional<GuildMemberInventory> findForUpdate(
            @Param("member") GuildMember member,
            @Param("monster") Monster monster
    );

    @Query("""
    select i
    from GuildMemberInventory i
    join i.monster m
    where i.guildMember = :member
      and m.code = :monsterCode
""")
    Optional<GuildMemberInventory> findByGuildMemberAndMonsterCode(
            @Param("member") GuildMember member,
            @Param("monsterCode") String monsterCode
    );

    @Query("""
        select i
        from GuildMemberInventory i
        join fetch i.monster
        where i.guildMember = :member
    """)
    List<GuildMemberInventory> findByGuildMember(@Param("member") GuildMember member);

    @Query("""
        select i
        from GuildMemberInventory i
        join fetch i.guildMember
        join fetch i.monster
        where i.guildMember in :members
          and i.monster in :monsters
    """)
    List<GuildMemberInventory> findByGuildMembersAndMonsters(
            @Param("members") List<GuildMember> members,
            @Param("monsters") List<Monster> monsters
    );

    Optional<GuildMemberInventory> findByGuildMemberAndMonster(GuildMember member, Monster monster);
}
