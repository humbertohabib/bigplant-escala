package br.com.bigplant.escala.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;

@Component
public class JwtAuthenticationFilter implements Filter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        if (!path.startsWith("/api/") || path.equals("/api/profissionais/login")) {
            chain.doFilter(request, response);
            return;
        }
        String authorization = httpRequest.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        DecodedJWT decoded;
        try {
            decoded = jwtService.validarToken(token);
        } catch (Exception e) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        String perfil = decoded.getClaim("perfil").asString();
        String perfilNormalizado =
                perfil != null && !perfil.isBlank() ? perfil.toUpperCase() : "MEDICO";
        boolean admin = "ADMIN".equals(perfilNormalizado);
        boolean coordenador = "COORDENADOR".equals(perfilNormalizado);
        boolean secretario = "SECRETARIO".equals(perfilNormalizado);
        boolean medico = "MEDICO".equals(perfilNormalizado);
        if ("POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/profissionais")) {
                if (!admin && !coordenador) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/turnos")) {
                if (!admin && !coordenador && !secretario) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/disponibilidades")) {
                if (!admin && !coordenador && !secretario && !medico) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/locais")) {
                if (!admin && !coordenador && !secretario) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/regras")) {
                if (!admin && !coordenador) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/escala")) {
                if (!admin && !coordenador && !secretario) {
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            }
        }
        httpRequest.setAttribute("usuarioId", decoded.getSubject());
        httpRequest.setAttribute("usuarioPerfil", perfilNormalizado);
        httpRequest.setAttribute("usuarioEmail", decoded.getClaim("email").asString());
        httpRequest.setAttribute("usuarioIdHospital", decoded.getClaim("idHospital").asLong());
        chain.doFilter(request, response);
    }
}
