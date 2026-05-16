package com.sbm.siegebackend.domain.deck;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OwnerlessDefenseDeckRepository extends JpaRepository<OwnerlessDefenseDeck, Long> {

    List<OwnerlessDefenseDeck> findByGuild_Id(Long guildId);

    @Query("""
    select distinct d
    from OwnerlessDefenseDeck d
    join fetch d.monsters m
    where d.guild.id = :guildId
""")
    List<OwnerlessDefenseDeck> findByGuildIdWithMonsters(@Param("guildId") Long guildId);
}


