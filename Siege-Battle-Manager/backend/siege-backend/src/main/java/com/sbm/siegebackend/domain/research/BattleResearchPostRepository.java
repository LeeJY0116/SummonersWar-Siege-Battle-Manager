package com.sbm.siegebackend.domain.research;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BattleResearchPostRepository extends JpaRepository<BattleResearchPost, Long> {

    List<BattleResearchPost> findByGuild_IdOrderByCreatedAtDesc(Long guildId);

    @Query("""
        select p from BattleResearchPost p
        left join fetch p.defenseMonsters
        where p.id = :postId
    """)
    Optional<BattleResearchPost> findDetailWithDefense(@Param("postId") Long postId);
}
