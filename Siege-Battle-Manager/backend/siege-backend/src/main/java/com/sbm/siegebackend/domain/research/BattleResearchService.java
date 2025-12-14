package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.guild.*;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.research.dto.*;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BattleResearchService {

    private final BattleResearchPostRepository postRepository;
    private final BattleResearchCommentRepository commentRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final MonsterRepository monsterRepository;
    private final UserService userService;

    public BattleResearchService(BattleResearchPostRepository postRepository,
                                 BattleResearchCommentRepository commentRepository,
                                 GuildMemberRepository guildMemberRepository,
                                 MonsterRepository monsterRepository,
                                 UserService userService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.monsterRepository = monsterRepository;
        this.userService = userService;
    }

    // =========================
    // 공통: 현재 유저 & 길드
    // =========================

    private GuildMember getActor(String email) {
        User user = userService.findByEmailOrThrow(email);
        return guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("길드에 가입되지 않은 유저입니다."));
    }

    private boolean isManager(GuildMember actor) {
        return actor.getRole() == GuildMemberRole.MASTER || actor.getRole() == GuildMemberRole.SUB_MASTER;
    }

    private Long getActorUserId(String email) {
        // 연구탭 작성자는 User 기준이므로 userId를 저장해둔다
        User user = userService.findByEmailOrThrow(email);
        return user.getId();
    }

    // =========================
    // 게시글(Post)
    // =========================

    public Long createPost(String email, BattleResearchPostCreateRequest request) {
        GuildMember actor = getActor(email);

        if (request.getDefenseMonsterIds() == null || request.getDefenseMonsterIds().size() != 3) {
            throw new IllegalArgumentException("방덱은 3마리 몬스터로 구성되어야 합니다.");
        }

        List<Monster> defense = request.getDefenseMonsterIds().stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        Long authorUserId = getActorUserId(email);
        String authorName = actor.getDisplayName(); // 길드 내 이름 스냅샷

        BattleResearchPost post = new BattleResearchPost(
                actor.getGuild(),
                request.getTitle(),
                defense,
                authorUserId,
                authorName
        );

        postRepository.save(post);
        return post.getId();
    }

    @Transactional(readOnly = true)
    public List<BattleResearchPostListItemResponse> listPosts(String email) {
        GuildMember actor = getActor(email);
        Long guildId = actor.getGuild().getId();

        List<BattleResearchPost> posts = postRepository.findByGuild_IdOrderByCreatedAtDesc(guildId);

        return posts.stream()
                .map(p -> new BattleResearchPostListItemResponse(
                        p.getId(),
                        p.getTitle(),
                        p.getAuthorName(),
                        p.getAuthorUserId(),
                        p.getDefenseMonsters().stream()
                                .map(m -> new BattleResearchPostListItemResponse.MonsterItem(m.getId(), m.getName()))
                                .toList(),
                        commentRepository.findByPost_IdOrderByCreatedAtAsc(p.getId()).size(),
                        p.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public BattleResearchPostDetailResponse getPostDetail(String email, Long postId) {
        GuildMember actor = getActor(email);

        BattleResearchPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글은 조회할 수 없습니다.");
        }

        List<BattleResearchCommentResponse> comments = commentRepository.findByPost_IdOrderByCreatedAtAsc(postId)
                .stream()
                .map(c -> new BattleResearchCommentResponse(
                        c.getId(),
                        c.getAuthorName(),
                        c.getAuthorUserId(),
                        c.getAttackMonsters().stream()
                                .map(m -> new BattleResearchCommentResponse.MonsterItem(m.getId(), m.getName()))
                                .toList(),
                        c.getContent(),
                        c.getCreatedAt(),
                        c.getUpdatedAt()
                ))
                .toList();

        return new BattleResearchPostDetailResponse(
                post.getId(),
                post.getTitle(),
                post.getAuthorName(),
                post.getAuthorUserId(),
                post.getDefenseMonsters().stream()
                        .map(m -> new BattleResearchPostDetailResponse.MonsterItem(m.getId(), m.getName()))
                        .toList(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                comments
        );
    }

    public void updatePost(String email, Long postId, BattleResearchPostUpdateRequest request) {
        GuildMember actor = getActor(email);
        Long actorUserId = getActorUserId(email);

        BattleResearchPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글은 수정할 수 없습니다.");
        }

        // 작성자만 수정 가능
        if (post.getAuthorUserId() == null || !post.getAuthorUserId().equals(actorUserId)) {
            throw new IllegalStateException("작성자만 게시글을 수정할 수 있습니다.");
        }

        if (request.getDefenseMonsterIds() == null || request.getDefenseMonsterIds().size() != 3) {
            throw new IllegalArgumentException("방덱은 3마리 몬스터로 구성되어야 합니다.");
        }

        List<Monster> defense = request.getDefenseMonsterIds().stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        post.changeTitle(request.getTitle());
        post.changeDefenseMonsters(defense);
    }

    public void deletePost(String email, Long postId) {
        GuildMember actor = getActor(email);
        Long actorUserId = getActorUserId(email);

        BattleResearchPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글은 삭제할 수 없습니다.");
        }

        boolean isAuthor = post.getAuthorUserId() != null && post.getAuthorUserId().equals(actorUserId);
        boolean manager = isManager(actor);

        if (!isAuthor && !manager) {
            throw new IllegalStateException("작성자 또는 마스터/부마스터만 삭제할 수 있습니다.");
        }

        // 게시글 삭제 시 댓글도 같이 삭제되어야 하므로
        // 댓글을 먼저 삭제하고 post 삭제 (JPA cascade 설정 안 했으니 확실하게)
        List<BattleResearchComment> comments = commentRepository.findByPost_IdOrderByCreatedAtAsc(postId);
        commentRepository.deleteAll(comments);

        postRepository.delete(post);
    }

    // =========================
    // 댓글(Comment)
    // =========================

    public Long createComment(String email, Long postId, BattleResearchCommentCreateRequest request) {
        GuildMember actor = getActor(email);

        BattleResearchPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글에는 댓글을 달 수 없습니다.");
        }

        List<Long> ids = request.getAttackMonsterIds() == null ? List.of() : request.getAttackMonsterIds();
        if (ids.size() > 3) {
            throw new IllegalArgumentException("공덱 몬스터는 최대 3마리까지 선택 가능합니다.");
        }

        List<Monster> attack = ids.stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        Long authorUserId = getActorUserId(email);
        String authorName = actor.getDisplayName();

        BattleResearchComment comment = new BattleResearchComment(
                post,
                attack,
                request.getContent(),
                authorUserId,
                authorName
        );

        commentRepository.save(comment);
        return comment.getId();
    }

    public void updateComment(String email, Long commentId, BattleResearchCommentUpdateRequest request) {
        GuildMember actor = getActor(email);
        Long actorUserId = getActorUserId(email);

        BattleResearchComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("댓글이 존재하지 않습니다."));

        // 같은 길드인지 확인
        if (!comment.getPost().getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 댓글은 수정할 수 없습니다.");
        }

        // 작성자만 수정 가능
        if (comment.getAuthorUserId() == null || !comment.getAuthorUserId().equals(actorUserId)) {
            throw new IllegalStateException("작성자만 댓글을 수정할 수 있습니다.");
        }

        List<Long> ids = request.getAttackMonsterIds() == null ? List.of() : request.getAttackMonsterIds();
        if (ids.size() > 3) {
            throw new IllegalArgumentException("공덱 몬스터는 최대 3마리까지 선택 가능합니다.");
        }

        List<Monster> attack = ids.stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();

        comment.changeAttackMonsters(attack);
        comment.changeContent(request.getContent());
    }

    public void deleteComment(String email, Long commentId) {
        GuildMember actor = getActor(email);
        Long actorUserId = getActorUserId(email);

        BattleResearchComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("댓글이 존재하지 않습니다."));

        if (!comment.getPost().getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 댓글은 삭제할 수 없습니다.");
        }

        boolean isAuthor = comment.getAuthorUserId() != null && comment.getAuthorUserId().equals(actorUserId);
        boolean manager = isManager(actor);

        if (!isAuthor && !manager) {
            throw new IllegalStateException("작성자 또는 마스터/부마스터만 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }
}
