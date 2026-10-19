package com.checkupnow.config;

import com.checkupnow.model.User;
import com.checkupnow.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SessionUserAuthenticationFilter extends OncePerRequestFilter {
    private final UserRepository userRepository;

    public SessionUserAuthenticationFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        Object rawUserId = session == null ? null : session.getAttribute("userId");

        SecurityContextHolder.clearContext();
        if (rawUserId instanceof Long userId) {
            userRepository.findById(userId).ifPresent(this::authenticate);
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(User user) {
        var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole());
        var authentication = new UsernamePasswordAuthenticationToken(user.getId(), null, List.of(authority));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
