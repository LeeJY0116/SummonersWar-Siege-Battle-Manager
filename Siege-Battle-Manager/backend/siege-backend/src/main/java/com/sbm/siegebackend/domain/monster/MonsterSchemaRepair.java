package com.sbm.siegebackend.domain.monster;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(0)
public class MonsterSchemaRepair implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public MonsterSchemaRepair(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        String databaseProductName = jdbcTemplate.execute((ConnectionCallback<String>) (connection) ->
                connection.getMetaData().getDatabaseProductName()
        );

        if (!"H2".equalsIgnoreCase(databaseProductName)) {
            return;
        }

        List<String> constraints = jdbcTemplate.queryForList("""
                select tc.constraint_name
                from information_schema.table_constraints tc
                join information_schema.key_column_usage kcu
                  on tc.constraint_catalog = kcu.constraint_catalog
                 and tc.constraint_schema = kcu.constraint_schema
                 and tc.constraint_name = kcu.constraint_name
                where tc.table_schema = schema()
                  and tc.table_name = 'MONSTERS'
                  and tc.constraint_type = 'UNIQUE'
                  and kcu.column_name = 'NAME'
                """, String.class);

        for (String constraint : constraints) {
            jdbcTemplate.execute("alter table monsters drop constraint " + constraint);
        }
    }
}
