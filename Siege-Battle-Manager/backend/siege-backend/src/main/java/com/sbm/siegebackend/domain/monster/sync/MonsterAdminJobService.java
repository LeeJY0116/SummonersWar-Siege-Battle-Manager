package com.sbm.siegebackend.domain.monster.sync;

import com.sbm.siegebackend.global.exception.BusinessException;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MonsterAdminJobService {

    private static final String JOB_NAME = "monster-admin";
    private static final String STATUS_IDLE = "IDLE";
    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_FAILED = "FAILED";
    private static final Duration APPLY_STALE_TIMEOUT = Duration.ofMinutes(2);
    private static final Duration SYNC_STALE_TIMEOUT = Duration.ofMinutes(10);

    private final JdbcTemplate jdbcTemplate;

    public MonsterAdminJobService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initialize() {
        jdbcTemplate.execute("""
                create table if not exists monster_admin_jobs (
                    job_name varchar(100) primary key,
                    operation varchar(100),
                    status varchar(30) not null,
                    processed_count integer not null default 0,
                    total_count integer,
                    message varchar(1000),
                    started_at timestamp,
                    updated_at timestamp,
                    finished_at timestamp
                )
                """);

        jdbcTemplate.update("""
                update monster_admin_jobs
                   set status = ?,
                       message = ?,
                       updated_at = ?,
                       finished_at = ?
                 where job_name = ?
                   and status = ?
                """,
                STATUS_FAILED,
                "서버 재시작으로 진행 중이던 작업이 중단되었습니다. 다시 실행해주세요.",
                Timestamp.valueOf(LocalDateTime.now()),
                Timestamp.valueOf(LocalDateTime.now()),
                JOB_NAME,
                STATUS_RUNNING
        );
    }

    public synchronized MonsterAdminJobStatusResponse start(String operation, String message) {
        MonsterAdminJobStatusResponse current = getStatus();

        if (current.running()) {
            throw new BusinessException("몬스터 관리 작업이 이미 진행 중입니다. 완료 후 다시 시도해주세요.");
        }

        LocalDateTime now = LocalDateTime.now();

        if (exists()) {
            jdbcTemplate.update("""
                    update monster_admin_jobs
                       set operation = ?,
                           status = ?,
                           processed_count = 0,
                           total_count = null,
                           message = ?,
                           started_at = ?,
                           updated_at = ?,
                           finished_at = null
                     where job_name = ?
                    """,
                    operation,
                    STATUS_RUNNING,
                    message,
                    Timestamp.valueOf(now),
                    Timestamp.valueOf(now),
                    JOB_NAME
            );
        } else {
            jdbcTemplate.update("""
                    insert into monster_admin_jobs (
                        job_name, operation, status, processed_count, total_count, message, started_at, updated_at, finished_at
                    ) values (?, ?, ?, 0, null, ?, ?, ?, null)
                    """,
                    JOB_NAME,
                    operation,
                    STATUS_RUNNING,
                    message,
                    Timestamp.valueOf(now),
                    Timestamp.valueOf(now)
            );
        }

        return getStatus();
    }

    public void updateProgress(String message, int processedCount, Integer totalCount) {
        jdbcTemplate.update("""
                update monster_admin_jobs
                   set processed_count = ?,
                       total_count = ?,
                       message = ?,
                       updated_at = ?
                 where job_name = ?
                """,
                processedCount,
                totalCount,
                message,
                Timestamp.valueOf(LocalDateTime.now()),
                JOB_NAME
        );
    }

    public void complete(String message, int processedCount, Integer totalCount) {
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("""
                update monster_admin_jobs
                   set status = ?,
                       processed_count = ?,
                       total_count = ?,
                       message = ?,
                       updated_at = ?,
                       finished_at = ?
                 where job_name = ?
                """,
                STATUS_COMPLETED,
                processedCount,
                totalCount,
                message,
                Timestamp.valueOf(now),
                Timestamp.valueOf(now),
                JOB_NAME
        );
    }

    public void fail(String message) {
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("""
                update monster_admin_jobs
                   set status = ?,
                       message = ?,
                       updated_at = ?,
                       finished_at = ?
                 where job_name = ?
                """,
                STATUS_FAILED,
                message,
                Timestamp.valueOf(now),
                Timestamp.valueOf(now),
                JOB_NAME
        );
    }

    public MonsterAdminJobStatusResponse getStatus() {
        failStaleRunningJob();

        List<MonsterAdminJobStatusResponse> statuses = jdbcTemplate.query(
                "select operation, status, processed_count, total_count, message, started_at, finished_at from monster_admin_jobs where job_name = ?",
                rowMapper(),
                JOB_NAME
        );

        if (statuses.isEmpty()) {
            return new MonsterAdminJobStatusResponse(null, STATUS_IDLE, 0, null, "진행 중인 작업이 없습니다.", null, null);
        }

        return statuses.get(0);
    }

    private boolean exists() {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from monster_admin_jobs where job_name = ?",
                Integer.class,
                JOB_NAME
        );
        return count != null && count > 0;
    }

    private void failStaleRunningJob() {
        List<RunningJobSnapshot> snapshots = jdbcTemplate.query(
                "select operation, updated_at from monster_admin_jobs where job_name = ? and status = ?",
                (rs, rowNum) -> new RunningJobSnapshot(
                        rs.getString("operation"),
                        getNullableDateTime(rs, "updated_at")
                ),
                JOB_NAME,
                STATUS_RUNNING
        );

        if (snapshots.isEmpty()) {
            return;
        }

        RunningJobSnapshot snapshot = snapshots.get(0);
        LocalDateTime updatedAt = snapshot.updatedAt();

        if (updatedAt == null) {
            fail("작업 갱신 시간이 없어 중단된 작업으로 처리했습니다. 다시 실행해주세요.");
            return;
        }

        Duration staleTimeout = "APPLY_LOCALIZATION".equals(snapshot.operation())
                ? APPLY_STALE_TIMEOUT
                : SYNC_STALE_TIMEOUT;

        if (updatedAt.plus(staleTimeout).isBefore(LocalDateTime.now())) {
            fail("작업이 오랫동안 갱신되지 않아 중단된 작업으로 처리했습니다. 다시 실행해주세요.");
        }
    }

    private RowMapper<MonsterAdminJobStatusResponse> rowMapper() {
        return (ResultSet rs, int rowNum) -> new MonsterAdminJobStatusResponse(
                rs.getString("operation"),
                rs.getString("status"),
                rs.getInt("processed_count"),
                getNullableInteger(rs, "total_count"),
                rs.getString("message"),
                getNullableDateTime(rs, "started_at"),
                getNullableDateTime(rs, "finished_at")
        );
    }

    private Integer getNullableInteger(ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }

    private LocalDateTime getNullableDateTime(ResultSet rs, String columnName) throws java.sql.SQLException {
        Timestamp timestamp = rs.getTimestamp(columnName);
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private record RunningJobSnapshot(String operation, LocalDateTime updatedAt) {
    }
}
