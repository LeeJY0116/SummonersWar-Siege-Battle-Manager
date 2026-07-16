package com.sbm.siegebackend.domain.guild.dto;

import java.util.List;

public record GuildBootstrapResponse(
        GuildResponse guild,
        List<GuildMemberResponse> members
) {
}
