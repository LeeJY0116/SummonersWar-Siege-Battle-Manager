package com.sbm.siegebackend.domain.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleResearchPostRepository extends JpaRepository<BattleResearchPost, Long> {

    List<BattleResearchPost> findByGuild_IdOrderByCreatedAtDesc(Long guildId);
}
