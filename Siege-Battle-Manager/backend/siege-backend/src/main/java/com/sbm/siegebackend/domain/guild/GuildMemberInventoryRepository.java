package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.monster.Monster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuildMemberInventoryRepository extends JpaRepository<GuildMemberInventory, Long> {

    List<GuildMemberInventory> findByGuildMember(GuildMember member);

    Optional<GuildMemberInventory> findByGuildMemberAndMonster(GuildMember member, Monster monster);
}
