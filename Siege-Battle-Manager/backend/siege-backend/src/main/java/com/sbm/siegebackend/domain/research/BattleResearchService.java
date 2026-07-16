package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.guild.*;
import com.sbm.siegebackend.domain.monster.Monster;
import com.sbm.siegebackend.domain.monster.MonsterRepository;
import com.sbm.siegebackend.domain.research.dto.*;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class BattleResearchService {

    private static final int POST_TITLE_MAX_LENGTH = 100;
    private static final int POST_CONTENT_MAX_LENGTH = 3000;
    private static final int COMMENT_CONTENT_MAX_LENGTH = 1000;
    private static final int CREATE_INTERVAL_SECONDS = 30;
    private static final int PAGE_SIZE = 10;

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
        return guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("길드에 가입되지 않은 유저입니다."));
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
        Long authorUserId = getActorUserId(email);

        validatePostCreateRateLimit(authorUserId);
        String title = normalizeRequired(request.getTitle(), "제목");
        String content = normalizeRequired(request.getContent(), "본문");
        validateMaxLength(title, POST_TITLE_MAX_LENGTH, "제목");
        validateMaxLength(content, POST_CONTENT_MAX_LENGTH, "본문");

        if (request.getMonsterCodes() == null || request.getMonsterCodes().size() != 3) {
            throw new IllegalArgumentException("방덱은 3마리 몬스터로 구성되어야 합니다.");
        }

        List<Monster> defense = request.getMonsterCodes().stream()
                .map(code -> monsterRepository.findByCode(code)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 CODE: " + code)))
                .toList();

        String authorName = actor.getDisplayName(); // 길드 내 이름 스냅샷

        BattleResearchPost post = new BattleResearchPost(
                actor.getGuild(),
                title,
                content,
                defense,
                authorUserId,
                authorName
        );

        postRepository.save(post);
        return post.getId();
    }

    @Transactional(readOnly = true)
    public BattleResearchPostPageResponse listPosts(String email,
                                                   int page,
                                                   String leaderEffectType,
                                                   List<String> monsterCodes,
                                                   boolean fourStarOnly) {
        GuildMember actor = getActor(email);
        Long guildId = actor.getGuild().getId();
        Pageable pageable = PageRequest.of(Math.max(0, page), PAGE_SIZE, Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedLeaderEffectType = normalizeOptional(leaderEffectType);
        List<String> normalizedMonsterCodes = normalizeMonsterCodes(monsterCodes);
        List<String> queryMonsterCodes = normalizedMonsterCodes.isEmpty()
                ? List.of("__NO_MONSTER_FILTER__")
                : normalizedMonsterCodes;

        Page<BattleResearchPost> postPage = postRepository.searchByGuildAndFilters(
                guildId,
                normalizedLeaderEffectType,
                queryMonsterCodes,
                normalizedMonsterCodes.size(),
                fourStarOnly,
                pageable
        );
        List<BattleResearchPost> posts = postPage.getContent();

        // ✅ 댓글 개수 한 번에 조회
        List<Long> postIds = posts.stream().map(BattleResearchPost::getId).toList();
        Map<Long, BattleResearchPost> postsWithDefenseById = postIds.isEmpty()
                ? Map.of()
                : postRepository.findByIdsWithDefense(postIds)
                .stream()
                .collect(Collectors.toMap(BattleResearchPost::getId, Function.identity()));

        var countRows = postIds.isEmpty()
                ? List.<BattleResearchCommentRepository.PostCommentCount>of()
                : commentRepository.countByPostIds(postIds);

        java.util.Map<Long, Long> countMap = countRows.stream()
                .collect(java.util.stream.Collectors.toMap(
                        BattleResearchCommentRepository.PostCommentCount::getPostId,
                        BattleResearchCommentRepository.PostCommentCount::getCnt
                ));

        List<BattleResearchPostListItemResponse> items = posts.stream()
                .map(p -> {
                    BattleResearchPost postWithDefense = postsWithDefenseById.getOrDefault(p.getId(), p);

                    return new BattleResearchPostListItemResponse(
                            p.getId(),
                            p.getTitle(),
                            p.getAuthorName(),
                            p.getAuthorUserId(),
                            postWithDefense.getDefenseMonsters().stream()
                                    .map(m -> new BattleResearchPostListItemResponse.MonsterItem(
                                            m.getId(),
                                            m.getCode(),
                                            getMonsterDisplayName(m)
                                    ))
                                    .toList(),
                            countMap.getOrDefault(p.getId(), 0L).intValue(),
                            p.getCreatedAt()
                    );
                })
                .toList();

        return new BattleResearchPostPageResponse(
                items,
                postPage.getNumber(),
                postPage.getSize(),
                postPage.getTotalElements(),
                postPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public BattleResearchPostDetailResponse getPostDetail(String email, Long postId, int commentPage) {
        GuildMember actor = getActor(email);

        BattleResearchPost post = postRepository.findDetailWithDefense(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글은 조회할 수 없습니다.");
        }

        Pageable pageable = PageRequest.of(Math.max(0, commentPage), PAGE_SIZE, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<BattleResearchComment> commentIdPage = commentRepository.findByPost_Id(postId, pageable);
        List<Long> commentIds = commentIdPage.getContent().stream()
                .map(BattleResearchComment::getId)
                .toList();
        List<BattleResearchComment> comments = commentIds.isEmpty()
                ? List.of()
                : commentRepository.findByIdsWithMonsters(commentIds).stream()
                .sorted(Comparator.comparing(BattleResearchComment::getCreatedAt))
                .toList();

        List<BattleResearchCommentResponse> commentResponses =
                comments.stream()
                .map(c -> new BattleResearchCommentResponse(
                        c.getId(),
                        c.getAuthorName(),
                        c.getAuthorUserId(),
                        c.getAttackMonsters().stream()
                                .map(m -> new BattleResearchCommentResponse.MonsterItem(
                                        m.getId(),
                                        m.getCode(),
                                        getMonsterDisplayName(m)
                                ))
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
                post.getContent(),
                post.getDefenseMonsters().stream()
                        .map(m -> new BattleResearchPostDetailResponse.MonsterItem(
                                m.getId(),
                                m.getCode(),
                                getMonsterDisplayName(m)
                                ))
                        .toList(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                commentResponses,
                commentIdPage.getNumber(),
                commentIdPage.getSize(),
                commentIdPage.getTotalElements(),
                commentIdPage.getTotalPages()
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

        List<Monster> defense = resolveDefenseMonsters(
                request.getDefenseMonsterCodes(),
                request.getDefenseMonsterIds()
        );

        if (defense.size() != 3) {
            throw new IllegalArgumentException("방덱은 3마리 몬스터로 구성되어야 합니다.");
        }

        String title = normalizeRequired(request.getTitle(), "제목");
        validateMaxLength(title, POST_TITLE_MAX_LENGTH, "제목");

        post.changeTitle(title);
        post.changeDefenseMonsters(defense);
    }

    public void deletePost(String email, Long postId) {
        GuildMember actor = getActor(email);
        Long actorUserId = getActorUserId(email);

        BattleResearchPost post = postRepository.findDetailWithDefense(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글은 삭제할 수 없습니다.");
        }

        boolean isAuthor = post.getAuthorUserId() != null && post.getAuthorUserId().equals(actorUserId);
        boolean master = actor.getRole() == GuildMemberRole.MASTER;

        if (!isAuthor && !master) {
            throw new IllegalStateException("작성자 또는 길드장만 게시글을 삭제할 수 있습니다.");
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
        Long authorUserId = getActorUserId(email);

        validateCommentCreateRateLimit(authorUserId);
        String content = normalizeRequired(request.getContent(), "댓글");
        validateMaxLength(content, COMMENT_CONTENT_MAX_LENGTH, "댓글");

        BattleResearchPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("게시글이 존재하지 않습니다."));

        if (!post.getGuild().getId().equals(actor.getGuild().getId())) {
            throw new IllegalStateException("다른 길드의 게시글에는 댓글을 달 수 없습니다.");
        }

        List<Monster> attack = resolveAttackMonsters(
                request.getAttackMonsterCodes(),
                request.getAttackMonsterIds()
        );

        if (attack.size() > 3) {
            throw new IllegalArgumentException("공덱 몬스터는 최대 3마리까지 선택 가능합니다.");
        }

        String authorName = actor.getDisplayName();

        BattleResearchComment comment = new BattleResearchComment(
                post,
                attack,
                content,
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

        List<Monster> attack = resolveAttackMonsters(
                request.getAttackMonsterCodes(),
                request.getAttackMonsterIds()
        );

        if (attack.size() > 3) {
            throw new IllegalArgumentException("공덱 몬스터는 최대 3마리까지 선택 가능합니다.");
        }

        String content = normalizeRequired(request.getContent(), "댓글");
        validateMaxLength(content, COMMENT_CONTENT_MAX_LENGTH, "댓글");

        comment.changeAttackMonsters(attack);
        comment.changeContent(content);
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
        boolean master = actor.getRole() == GuildMemberRole.MASTER;

        if (!isAuthor && !master) {
            throw new IllegalStateException("작성자 또는 길드장만 댓글을 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }

    private List<Monster> resolveDefenseMonsters(List<String> codes, List<Long> ids) {
        if (codes != null) {
            return codes.stream()
                    .map(code -> monsterRepository.findByCode(code)
                            .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 CODE: " + code)))
                    .toList();
        }

        List<Long> safeIds = ids == null ? List.of() : ids;
        return safeIds.stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();
    }

    private List<Monster> resolveAttackMonsters(List<String> codes, List<Long> ids) {
        if (codes != null) {
            return codes.stream()
                    .map(code -> monsterRepository.findByCode(code)
                            .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 CODE: " + code)))
                    .toList();
        }

        List<Long> safeIds = ids == null ? List.of() : ids;
        return safeIds.stream()
                .map(id -> monsterRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("존재하지 않는 몬스터 ID: " + id)))
                .toList();
    }

    private String getMonsterDisplayName(Monster monster) {
        if (monster.getKoreanName() != null && !monster.getKoreanName().isBlank()) {
            return monster.getKoreanName();
        }

        return monster.getName();
    }

    private void validatePostCreateRateLimit(Long authorUserId) {
        postRepository.findFirstByAuthorUserIdOrderByCreatedAtDesc(authorUserId)
                .ifPresent(post -> validateCreateInterval(post.getCreatedAt(), "전투 연구 게시글"));
    }

    private void validateCommentCreateRateLimit(Long authorUserId) {
        commentRepository.findFirstByAuthorUserIdOrderByCreatedAtDesc(authorUserId)
                .ifPresent(comment -> validateCreateInterval(comment.getCreatedAt(), "댓글"));
    }

    private void validateCreateInterval(LocalDateTime lastCreatedAt, String targetName) {
        if (lastCreatedAt.plusSeconds(CREATE_INTERVAL_SECONDS).isAfter(LocalDateTime.now())) {
            throw new IllegalStateException(targetName + "은 30초에 한 번 작성할 수 있습니다.");
        }
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + "을 입력해주세요.");
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private List<String> normalizeMonsterCodes(List<String> monsterCodes) {
        if (monsterCodes == null) {
            return List.of();
        }

        return monsterCodes.stream()
                .map(this::normalizeOptional)
                .filter(code -> code != null)
                .distinct()
                .toList();
    }

    private void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + "은 " + maxLength + "자 이하로 입력해주세요.");
        }
    }
}
