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
    private final UserService userService;

    public GuildService(GuildRepository guildRepository,
                        UserService userService) {
        this.guildRepository = guildRepository;
        this.userService = userService;
    }

    /**
     * 길드 생성: 현재 로그인 유저를 길드 마스터 + 첫 멤버로 등록
     */
    public GuildResponse createGuild(String email, GuildCreateRequest request) {
        User user = userService.findByEmailOrThrow(email);

        if (user.getGuild() != null) {
            throw new IllegalStateException("이미 길드에 가입되어 있습니다.");
        }

        if (guildRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("이미 존재하는 길드 이름입니다.");
        }

        Guild guild = new Guild(
                request.getName(),
                request.getDescription(),
                user
        );

        // 마스터도 멤버 목록에 포함
        guild.addMember(user);

        Guild saved = guildRepository.save(guild);

        return new GuildResponse(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getMaster().getNickname(),
                saved.getMembers().size()
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

        Guild guild = user.getGuild();
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
