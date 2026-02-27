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
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);

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

        logger.info("Request recebido no filtro. Method: {}, Path: {}", method, path);

        // Tratamento explícito de OPTIONS para CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            addCorsHeaders(httpResponse);
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        if (!path.startsWith("/api/")
                || path.equals("/api/profissionais/login")
                || path.startsWith("/api/profissionais/login/google")) {
            logger.info("Rota pública permitida: {}", path);
            chain.doFilter(request, response);
            return;
        }
        String authorization = httpRequest.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            logger.warn("Token ausente ou mal formatado. Header: {}", authorization);
            addCorsHeaders(httpResponse);
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        String token = authorization.substring("Bearer ".length()).trim();
        DecodedJWT decoded;
        try {
            decoded = jwtService.validarToken(token);
        } catch (Exception e) {
            logger.warn("Token inválido: {}", e.getMessage());
            addCorsHeaders(httpResponse);
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
                || "DELETE".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/profissionais")) {
                // POST e DELETE restritos a ADMIN
                if (("POST".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) && !admin) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
                // PUT e PATCH permitidos passarem para validação fina no Controller (ADMIN ou Próprio Usuário)
            } else if (path.startsWith("/api/turnos")) {
                if (!admin && !coordenador && !secretario) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/disponibilidades")) {
                if (!admin && !coordenador && !secretario && !medico) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/locais")) {
                if (!admin && !coordenador && !secretario) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/regras")) {
                if (!admin && !coordenador) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/auditoria")) {
                // Apenas ADMIN e AUDIT podem consultar logs gerais
                // Usuários comuns podem consultar logs deles mesmos (filtrado no Controller)
                // O filtro aqui permite a requisição passar, o Controller decide
            } else if (path.startsWith("/api/escala")) {
                if (!admin && !coordenador && !secretario) {
                    addCorsHeaders(httpResponse);
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            } else if (path.startsWith("/api/instituicoes")) {
                if (!admin) {
                    addCorsHeaders(httpResponse);
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

    private void addCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");
    }
}
