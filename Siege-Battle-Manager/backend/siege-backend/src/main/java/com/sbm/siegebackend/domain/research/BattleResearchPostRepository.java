package com.sbm.siegebackend.domain.research;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BattleResearchPostRepository extends JpaRepository<BattleResearchPost, Long> {

    List<BattleResearchPost> findByGuild_IdOrderByCreatedAtDesc(Long guildId);

    Page<BattleResearchPost> findByGuild_Id(Long guildId, Pageable pageable);

    @Query("""
        select p from BattleResearchPost p
        where p.guild.id = :guildId
          and (
            :leaderEffectType is null
            or exists (
              select 1
              from BattleResearchPost leaderPost
              join leaderPost.selectedMonsters leaderMonster
              where leaderPost = p
                and index(leaderMonster) = 0
                and leaderMonster.leaderEffectType = :leaderEffectType
                and (
                  leaderMonster.leaderEffectArea in ('General', 'Guild', 'Element', 'Attribute')
                  or (leaderMonster.leaderEffectArea is null and leaderMonster.leaderEffectElement is not null)
                )
            )
          )
          and (
            :monsterCodeCount = 0
            or (
              select count(distinct includedMonster.code)
              from BattleResearchPost monsterPost
              join monsterPost.selectedMonsters includedMonster
              where monsterPost = p
                and includedMonster.code in :monsterCodes
            ) = :monsterCodeCount
          )
          and (
            :fourStarOnly = false
            or not exists (
              select 1
              from BattleResearchPost starPost
              join starPost.selectedMonsters starMonster
              where starPost = p
                and coalesce(starMonster.naturalStars, 0) >= 5
            )
          )
    """)
    Page<BattleResearchPost> searchByGuildAndFilters(@Param("guildId") Long guildId,
                                                     @Param("leaderEffectType") String leaderEffectType,
                                                     @Param("monsterCodes") List<String> monsterCodes,
                                                     @Param("monsterCodeCount") long monsterCodeCount,
                                                     @Param("fourStarOnly") boolean fourStarOnly,
                                                     Pageable pageable);

    Optional<BattleResearchPost> findFirstByAuthorUserIdOrderByCreatedAtDesc(Long authorUserId);

    @Query("""
        select distinct p from BattleResearchPost p
        left join fetch p.selectedMonsters
        where p.id in :postIds
    """)
    List<BattleResearchPost> findByIdsWithDefense(@Param("postIds") List<Long> postIds);

    @Query("""
        select p from BattleResearchPost p
        left join fetch p.selectedMonsters
        where p.id = :postId
    """)
    Optional<BattleResearchPost> findDetailWithDefense(@Param("postId") Long postId);
}
