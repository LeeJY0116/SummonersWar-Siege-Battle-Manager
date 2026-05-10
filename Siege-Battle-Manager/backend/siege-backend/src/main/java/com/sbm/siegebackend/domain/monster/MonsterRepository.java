package com.sbm.siegebackend.domain.monster;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonsterRepository extends JpaRepository<Monster, Long> {

    Optional<Monster> findByName(String name);

    Optional<Monster> findByCode(String code);

    List<Monster> findAllByCodeIn(List<String> codes);
}
