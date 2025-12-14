package com.sbm.siegebackend.domain.research;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleResearchCommentRepository extends JpaRepository<BattleResearchComment, Long> {

    List<BattleResearchComment> findByPost_IdOrderByCreatedAtAsc(Long postId);
}
