package com.ulis.business.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

/**
 * Cấu hình realtime (ticket 09): STOMP thô trên endpoint <code>/ws</code>.
 * <ul>
 *   <li>Handshake xác thực JWT qua query param <code>?token=</code>
 *       ({@link WsHandshakeInterceptor}); principal của phiên STOMP là
 *       {@link WsPrincipal} với getName() = userId để broker định tuyến
 *       <code>/user/{id}/queue/...</code> đúng từng người.</li>
 *   <li>Client gửi lên <code>/app/chat.send</code>; nhận về các hàng đợi cá nhân
 *       <code>/user/queue/chat.messages</code>,
 *       <code>/user/queue/chat.conversations</code>,
 *       <code>/user/queue/chat.errors</code>.</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WsConfig implements WebSocketMessageBrokerConfigurer {

    private final WsHandshakeInterceptor handshakeInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor)
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                                      Map<String, Object> attributes) {
                        Object principal = attributes.get(WsHandshakeInterceptor.ATTR_PRINCIPAL);
                        return principal instanceof Principal p ? p : null;
                    }
                });
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Broker đơn giản trong bộ nhớ: topic chung + queue cá nhân theo user.
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
