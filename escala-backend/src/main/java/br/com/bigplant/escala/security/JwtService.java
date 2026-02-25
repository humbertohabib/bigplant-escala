package br.com.bigplant.escala.security;

import br.com.bigplant.escala.model.Profissional;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtService() {
        this.algorithm = Algorithm.HMAC256("change-this-secret".getBytes(StandardCharsets.UTF_8));
        this.verifier = JWT.require(algorithm).withIssuer("escala-backend").build();
    }

    public String gerarToken(Profissional profissional) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plus(8, ChronoUnit.HOURS);
        String perfil = profissional.getPerfil();
        String perfilNormalizado = perfil != null && !perfil.isBlank() ? perfil : "MEDICO";
        return JWT.create()
                .withIssuer("escala-backend")
                .withSubject(String.valueOf(profissional.getId()))
                .withClaim("nome", profissional.getNome())
                .withClaim("email", profissional.getEmail())
                .withClaim("perfil", perfilNormalizado)
                .withClaim("idHospital", profissional.getIdHospital())
                .withIssuedAt(Date.from(agora))
                .withExpiresAt(Date.from(expiracao))
                .sign(algorithm);
    }

    public DecodedJWT validarToken(String token) {
        return verifier.verify(token);
    }
}

