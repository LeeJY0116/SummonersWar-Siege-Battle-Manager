package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;
import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GuildService {

    private final GuildRepository guildRepository;
    private final GuildMemberRepository guildMemberRepository;
    private final UserService userService;

    public GuildService(GuildRepository guildRepository,
                        GuildMemberRepository guildMemberRepository,
                        UserService userService) {
        this.guildRepository = guildRepository;
        this.guildMemberRepository = guildMemberRepository;
        this.userService = userService;
    }

    /**
     * 길드 생성: 현재 로그인 유저를 길드 마스터 + 첫 멤버로 등록
     */
    public GuildResponse createGuild(String email, GuildCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        // ✅ 이미 어떤 길드에 가입되어 있는지 검사
        if (guildMemberRepository.existsByUser(user)) {
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
                savedGuild.getMaster().getNickname(),
                savedGuild.getMembers().size()
        );
    }

    /**
     * 길드 전체 목록 조회
     */
    @Transactional(readOnly = true)
    public List<GuildResponse> getAllGuilds() {
        return guildRepository.findAll().stream()
                .map(g -> new GuildResponse(
                        g.getId(),
                        g.getName(),
                        g.getDescription(),
                        g.getMaster().getNickname(),
                        g.getMembers().size()
                ))
                .toList();
    }

    /**
     * 내 길드 정보 조회
     */
    @Transactional(readOnly = true)
    public GuildResponse getMyGuild(String email) {
        User user = userService.findByEmailOrThrow(email);

        // REAL 멤버 중 user_id 가 같은 길드원 찾기
        GuildMember member = guildMemberRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("가입된 길드가 없습니다."));

        Guild guild = member.getGuild();
        if (guild == null) {
            throw new IllegalStateException("가입된 길드가 없습니다.");
        }

        return new GuildResponse(
                guild.getId(),
                guild.getName(),
                guild.getDescription(),
                guild.getMaster().getNickname(),
                guild.getMembers().size()
        );
    }
}
