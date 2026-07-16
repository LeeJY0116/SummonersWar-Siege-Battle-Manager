package com.sbm.siegebackend.domain.user.dto;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;

import java.util.List;

public record UserBootstrapResponse(
        UserMeResponse me,
        GuildResponse guild,
        List<GuildMemberResponse> members
) {
}
