package com.sbm.siegebackend.domain.research;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BattleResearchCommentRepository extends JpaRepository<BattleResearchComment, Long> {

    List<BattleResearchComment> findByPost_IdOrderByCreatedAtAsc(Long postId);

    // ✅ 게시글 1개 댓글 수
    long countByPost_Id(Long postId);

    // ✅ 게시글 여러 개 댓글 수를 한 번에 (추천)
    @Query("""
        select c.post.id as postId, count(c) as cnt
        from BattleResearchComment c
        where c.post.id in :postIds
        group by c.post.id
    """)
    List<PostCommentCount> countByPostIds(@Param("postIds") List<Long> postIds);

    interface PostCommentCount {
        Long getPostId();
        Long getCnt();
    }

    @Query("""
    select distinct c from BattleResearchComment c
    left join fetch c.attackMonsters
    where c.post.id = :postId
    order by c.createdAt asc
""")
    List<BattleResearchComment> findByPostIdWithMonsters(@Param("postId") Long postId);

}
