package com.sbm.siegebackend.config;

import com.sbm.siegebackend.domain.user.User;
import com.sbm.siegebackend.domain.user.UserRepository;
import com.sbm.siegebackend.domain.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminId;
    private final String adminPassword;
    private final String adminEmail;
    private final String adminNickname;

    public AdminAccountInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.initial-id:}") String adminId,
            @Value("${app.admin.initial-password:}") String adminPassword,
            @Value("${app.admin.initial-email:admin@example.local}") String adminEmail,
            @Value("${app.admin.initial-nickname:admin}") String adminNickname
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminId = adminId;
        this.adminPassword = adminPassword;
        this.adminEmail = adminEmail;
        this.adminNickname = adminNickname;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminId.isBlank() || adminPassword.isBlank()) {
            return;
        }

        if (userRepository.existsByLoginId(adminId)) {
            return;
        }

        User admin = User.create(
                adminId,
                adminEmail,
                passwordEncoder.encode(adminPassword),
                adminNickname,
                UserRole.ADMIN
        );

        userRepository.save(admin);
    }
}
