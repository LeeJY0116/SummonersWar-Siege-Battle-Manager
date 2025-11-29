package com.sbm.siegebackend.domain.guild;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuildRepository extends JpaRepository<Guild, Long> {

    boolean existsByName(String name);

    Optional<Guild> findByName(String name);
}
