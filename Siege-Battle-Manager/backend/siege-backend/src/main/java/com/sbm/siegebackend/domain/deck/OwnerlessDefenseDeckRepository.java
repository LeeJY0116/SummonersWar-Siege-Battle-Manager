package com.sbm.siegebackend.domain.deck;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OwnerlessDefenseDeckRepository extends JpaRepository<OwnerlessDefenseDeck, Long> {

    List<OwnerlessDefenseDeck> findByGuild_Id(Long guildId);
}
