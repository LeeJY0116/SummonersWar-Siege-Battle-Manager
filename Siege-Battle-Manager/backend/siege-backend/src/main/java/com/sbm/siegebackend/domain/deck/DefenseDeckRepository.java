package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.guild.GuildMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DefenseDeckRepository extends JpaRepository<DefenseDeck, Long> {

    // 길드 기준 전체 방덱 + 몬스터 한 번에 로딩
    // 기존: findByOwner_Guild_Id(guildId) 대신 사용할 것
    @Query("""
        select distinct d
        from DefenseDeck d
        join fetch d.owner o
        join fetch d.monsters ms
        where o.guild.id = :guildId
    """)
    List<DefenseDeck> findByGuildIdWithOwnerAndMonsters(@Param("guildId") Long guildId);

    List<DefenseDeck> findByOwner(GuildMember owner);

    List<DefenseDeck> findByOwner_Guild_Id(Long guildId);

}
