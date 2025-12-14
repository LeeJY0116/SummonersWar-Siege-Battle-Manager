package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.guild.GuildMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DefenseDeckRepository extends JpaRepository<DefenseDeck, Long> {

    List<DefenseDeck> findByOwner(GuildMember owner);

    List<DefenseDeck> findByOwner_Guild_Id(Long guildId);

}
