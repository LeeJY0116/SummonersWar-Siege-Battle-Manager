package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberHistoryResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;
import com.sbm.siegebackend.domain.guild.dto.UserNicknameHistoryResponse;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserNicknameHistory;
import com.sbm.siegebackend.domain.user.UserNicknameHistoryRepository;
import com.sbm.siegebackend.domain.user.UserRole;
import com.sbm.siegebackend.domain.user.UserService;
import com.sbm.siegebackend.global.exception.ForbiddenException;
import com.sbm.siegebackend.global.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class GuildService {

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final UserNicknameHistoryRepository userNicknameHistoryRepository;
    private final UserService userService;

    public GuildService(GuildRepository guildRepository,
                        GuildMemberRepository guildMemberRepository,
                        UserNicknameHistoryRepository userNicknameHistoryRepository,
                        UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.userNicknameHistoryRepository = userNicknameHistoryRepository;
        this.userService = userService;
    }

    /**
     * 길드 생성: 현재 로그인 유저를 길드 마스터 + 첫 멤버로 등록
     */
    public GuildResponse createGuild(String email, GuildCreateRequest request) {

        // 유저 조회
        User user = userService.findByEmailOrThrow(email);

        // ✅ 이미 어떤 길드에 가입되어 있는지 검사
        if (guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED).isPresent()) {
            throw new IllegalStateException("이미 길드에 가입되어 있습니다.");
        }

        // 길드 이름 중복 검사
        if (guildRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 길드 이름입니다.");
        }

        // 길드 생성
        Guild guild = new Guild(
                request.getName(),
                request.getDescription(),
                user
        );

        // 길드 저장
        Guild savedGuild = guildRepository.save(guild);

        // 길드 멤버 생성 (실제 유저 + MASTER 역할)
        GuildMember masterMember = GuildMember.createReal(
                savedGuild,
                user,
                GuildMemberRole.MASTER
        );

        guildMemberRepository.save(masterMember);   // 길드 멤버 저장
        savedGuild.addMember(masterMember);         // 길드 멤버 추가

        return new GuildResponse(
                savedGuild.getId(),
                savedGuild.getName(),
                savedGuild.getDescription(),
                resolveMasterNickname(savedGuild),
                getApprovedMemberCount(savedGuild)
        );
    }

    /**
     * 길드 전체 목록 조회
     */
    @Transactional(readOnly = true)
    public List<GuildResponse> getAllGuilds() {
        return guildRepository.findAll().stream()
                .filter(this::hasApprovedMaster)
                .map(g -> new GuildResponse(
                        g.getId(),
                        g.getName(),
                        g.getDescription(),
                        resolveMasterNickname(g),
                        getApprovedMemberCount(g)
                ))
                .toList();
    }

    private boolean hasApprovedMaster(Guild guild) {
        return guildMemberRepository.existsByGuildAndRoleAndStatus(
                guild,
                GuildMemberRole.MASTER,
                GuildMemberStatus.APPROVED
        );
    }

    @Transactional(readOnly = true)
    public List<GuildResponse> getAdminGuilds(String loginId) {
        validateAdmin(loginId);

        return guildRepository.findAll().stream()
                .map(g -> new GuildResponse(
                        g.getId(),
                        g.getName(),
                        g.getDescription(),
                        resolveMasterNickname(g),
                        getApprovedMemberCount(g)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuildMemberResponse> getAdminGuildMembers(String loginId, Long guildId) {
        validateAdmin(loginId);

        Guild guild = guildRepository.findById(guildId)
                .orElseThrow(() -> new NotFoundException("길드를 찾을 수 없습니다."));

        Map<String, GuildMember> latestMembers = new LinkedHashMap<>();
        guildMemberRepository.findAllByGuild(guild)
                .stream()
                .sorted(Comparator.comparing(GuildMember::getId).reversed())
                .forEach(member -> latestMembers.putIfAbsent(getAdminMemberDedupKey(member), member));

        return latestMembers.values()
                .stream()
                .map(this::toAdminMemberResponse)
                .sorted(this::compareAdminMemberResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GuildMemberHistoryResponse> getAdminGuildMemberHistory(String loginId, Long guildMemberId) {
        validateAdmin(loginId);

        GuildMember baseMember = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("길드원을 찾을 수 없습니다."));

        User user = baseMember.getUser();
        if (user == null) {
            return List.of(toHistoryResponse(baseMember));
        }

        return guildMemberRepository.findAllByUserOrderByIdDesc(user)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public List<UserNicknameHistoryResponse> getAdminNicknameHistories(String loginId, Long guildMemberId) {
        validateAdmin(loginId);

        GuildMember member = guildMemberRepository.findById(guildMemberId)
                .orElseThrow(() -> new NotFoundException("길드원을 찾을 수 없습니다."));

        User user = member.getUser();
        if (user == null) {
            return List.of();
        }

        ensureInitialNicknameHistory(user);

        return userNicknameHistoryRepository.findAllByUserOrderByIdDesc(user)
                .stream()
                .map(this::toNicknameHistoryResponse)
                .toList();
    }

    private void validateAdmin(String loginId) {
        User user = userService.findByLoginIdOrThrow(loginId);
        if (user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("관리자만 조회할 수 있습니다.");
        }
    }

    /**
     * 내 길드 정보 조회
     */
    @Transactional(readOnly = true)
    public GuildResponse getMyGuild(String email) {
        User user = userService.findByEmailOrThrow(email);

        // REAL 멤버 중 user_id 가 같은 길드원 찾기
        GuildMember member = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("가입된 길드가 없습니다."));

        Guild guild = member.getGuild();
        if (guild == null) {
            throw new IllegalStateException("가입된 길드가 없습니다.");
        }

        return new GuildResponse(
                guild.getId(),
                guild.getName(),
                guild.getDescription(),
                resolveMasterNickname(guild),
                getApprovedMemberCount(guild)
        );
    }

    @Transactional(readOnly = true)
    public List<GuildMemberResponse> getMyGuildMembers(String email) {
        User user = userService.findByEmailOrThrow(email);

        GuildMember myMember = guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("가입된 길드가 없습니다."));

        Guild guild = myMember.getGuild();

        return guildMemberRepository.findAllByGuild(guild)
                .stream()
                .filter(m -> m.getStatus() == GuildMemberStatus.APPROVED)
                .map(this::toMemberResponse)
                .toList();
    }

    private GuildMemberResponse toMemberResponse(GuildMember member) {
        User user = member.getUser();
        return new GuildMemberResponse(
                member.getId(),
                user == null ? null : user.getId(),
                user == null ? null : user.getLoginId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getNickname(),
                member.getDisplayName(),
                member.getRole(),
                member.getType(),
                member.getStatus(),
                member.isRealUser(),
                null,
                user == null ? null : user.getLastLoginAt()
        );
    }

    private GuildMemberResponse toAdminMemberResponse(GuildMember member) {
        User user = member.getUser();
        String currentGuildName = resolveCurrentGuildName(user);

        return new GuildMemberResponse(
                member.getId(),
                user == null ? null : user.getId(),
                user == null ? null : user.getLoginId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getNickname(),
                member.getDisplayName(),
                member.getRole(),
                member.getType(),
                member.getStatus(),
                member.isRealUser(),
                currentGuildName,
                user == null ? null : user.getLastLoginAt()
        );
    }

    private String getAdminMemberDedupKey(GuildMember member) {
        User user = member.getUser();
        if (user == null) {
            return "virtual:" + member.getId();
        }

        return "user:" + user.getId();
    }

    private int compareAdminMemberResponse(GuildMemberResponse a, GuildMemberResponse b) {
        int currentGuildCompare = Boolean.compare(
                b.getCurrentGuildName() != null,
                a.getCurrentGuildName() != null
        );
        if (currentGuildCompare != 0) {
            return currentGuildCompare;
        }

        int roleCompare = Integer.compare(getRoleRank(b.getRole()), getRoleRank(a.getRole()));
        if (roleCompare != 0) {
            return roleCompare;
        }

        return nullSafe(a.getDisplayName()).compareTo(nullSafe(b.getDisplayName())) * -1;
    }

    private int getRoleRank(GuildMemberRole role) {
        if (role == GuildMemberRole.MASTER) {
            return 3;
        }
        if (role == GuildMemberRole.SUB_MASTER) {
            return 2;
        }
        if (role == GuildMemberRole.MEMBER) {
            return 1;
        }

        return 0;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String resolveCurrentGuildName(User user) {
        if (user == null) {
            return null;
        }

        return guildMemberRepository.findFirstByUserAndStatusOrderByIdDesc(user, GuildMemberStatus.APPROVED)
                .map(member -> member.getGuild().getName())
                .orElse(null);
    }

    private GuildMemberHistoryResponse toHistoryResponse(GuildMember member) {
        Guild guild = member.getGuild();
        return new GuildMemberHistoryResponse(
                member.getId(),
                guild.getId(),
                guild.getName(),
                member.getDisplayName(),
                member.getRole(),
                member.getStatus(),
                member.getCreatedAt(),
                member.getUpdatedAt()
        );
    }

    private void ensureInitialNicknameHistory(User user) {
        if (userNicknameHistoryRepository.existsByUser(user)) {
            return;
        }

        userNicknameHistoryRepository.save(UserNicknameHistory.initial(user));
    }

    private UserNicknameHistoryResponse toNicknameHistoryResponse(UserNicknameHistory history) {
        User changedBy = history.getChangedBy();
        return new UserNicknameHistoryResponse(
                history.getId(),
                history.getPreviousNickname(),
                history.getNewNickname(),
                changedBy == null ? null : changedBy.getLoginId(),
                history.getChangeType(),
                history.getCreatedAt()
        );
    }

    private int getApprovedMemberCount(Guild guild) {
        return guildMemberRepository.countByGuildAndStatus(guild, GuildMemberStatus.APPROVED);
    }

    private String resolveMasterNickname(Guild guild) {
        return guildMemberRepository.findFirstByGuildAndRoleAndStatusOrderByIdDesc(
                        guild,
                        GuildMemberRole.MASTER,
                        GuildMemberStatus.APPROVED
                )
                .map(GuildMember::getDisplayName)
                .orElseGet(() -> guild.getMaster().getNickname());
    }


}
