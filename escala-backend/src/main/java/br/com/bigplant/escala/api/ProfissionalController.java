package br.com.bigplant.escala.api;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profissionais")
public class ProfissionalController {

    private static final Logger logger = LoggerFactory.getLogger(ProfissionalController.class);

    private final ProfissionalRepository profissionalRepository;
    private final JwtService jwtService;

    @Value("${google.clientId:}")
    private String googleClientId;

    @Value("${google.autoOnboardingDomain:#{null}}")
    private String googleAutoOnboardingDomain;

    @Value("${google.autoOnboardingDefaultHospitalId:1}")
    private Long googleAutoOnboardingDefaultHospitalId;

    public ProfissionalController(
            ProfissionalRepository profissionalRepository, JwtService jwtService) {
        this.profissionalRepository = profissionalRepository;
        this.jwtService = jwtService;
    }

    public static class LoginRequest {

        public String email;
        public String senha;
    }

    public static class LoginResponse {

        public Long id;
        public String nome;
        public String email;
        public String perfil;
        public Long idHospital;
        public String token;
    }

    public static class GoogleLoginRequest {

        public String idToken;
    }

    @GetMapping("/hospital/{idHospital}")
    public ResponseEntity<List<Profissional>> listarPorHospital(@PathVariable Long idHospital) {
        List<Profissional> profissionais = profissionalRepository.findByIdHospitalAndAtivoTrue(idHospital);
        return ResponseEntity.ok(profissionais);
    }

    @GetMapping
    public ResponseEntity<List<Profissional>> listarTodos() {
        return ResponseEntity.ok(profissionalRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profissional> buscarPorId(@PathVariable Long id) {
        return profissionalRepository
                .findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Profissional> criar(@RequestBody Profissional profissional) {
        if (profissional.getAtivo() == null) {
            profissional.setAtivo(true);
        }
        if (profissional.getPerfil() == null || profissional.getPerfil().isBlank()) {
            profissional.setPerfil("MEDICO");
        }
        if (profissional.getSenha() != null && !profissional.getSenha().isBlank()) {
            String hash = BCrypt.hashpw(profissional.getSenha(), BCrypt.gensalt(12));
            profissional.setSenha(hash);
        }
        Profissional salvo = profissionalRepository.save(profissional);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profissional> atualizar(@PathVariable Long id, @RequestBody Profissional profissional) {
        return profissionalRepository
                .findById(id)
                .map(existente -> {
                    existente.setNome(profissional.getNome());
                    existente.setCrm(profissional.getCrm());
                    existente.setIdHospital(profissional.getIdHospital());
                    existente.setCargaHorariaMensalMaxima(profissional.getCargaHorariaMensalMaxima());
                    existente.setCargaHorariaMensalMinima(profissional.getCargaHorariaMensalMinima());
                    existente.setAtivo(profissional.getAtivo());
                    existente.setEmail(profissional.getEmail());
                    existente.setTelefoneWhatsapp(profissional.getTelefoneWhatsapp());
                    if (profissional.getPerfil() != null && !profissional.getPerfil().isBlank()) {
                        existente.setPerfil(profissional.getPerfil());
                    }
                    if (profissional.getSenha() != null && !profissional.getSenha().isBlank()) {
                        String hash = BCrypt.hashpw(profissional.getSenha(), BCrypt.gensalt(12));
                        existente.setSenha(hash);
                    }
                    Profissional salvo = profissionalRepository.save(existente);
                    return ResponseEntity.ok(salvo);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request == null
                || request.email == null
                || request.email.isBlank()
                || request.senha == null
                || request.senha.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String email = request.email.trim();
        Optional<Profissional> profissionalOpt = profissionalRepository.findByEmailAndAtivoTrue(email);
        if (profissionalOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Profissional profissional = profissionalOpt.get();
        String senhaArmazenada = profissional.getSenha();
        if (senhaArmazenada == null || !BCrypt.checkpw(request.senha, senhaArmazenada)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        LoginResponse response = new LoginResponse();
        response.id = profissional.getId();
        response.nome = profissional.getNome();
        response.email = profissional.getEmail();
        response.idHospital = profissional.getIdHospital();
        String perfil = profissional.getPerfil();
        response.perfil = perfil != null && !perfil.isBlank() ? perfil : "MEDICO";
        response.token = jwtService.gerarToken(profissional);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginGoogle(@RequestBody GoogleLoginRequest request) {
        logger.info("Recebendo requisição de login Google");
        if (request == null || request.idToken == null || request.idToken.isBlank()) {
            logger.warn("Token Google vazio ou requisição nula");
            return ResponseEntity.badRequest().body("Token Google vazio ou requisição nula");
        }
        if (googleClientId == null || googleClientId.isBlank()) {
            logger.error("Google Client ID não configurado no backend");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Google Client ID não configurado no backend");
        }
        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier =
                    new GoogleIdTokenVerifier.Builder(
                                    new NetHttpTransport(), JacksonFactory.getDefaultInstance())
                            .setAudience(Collections.singletonList(googleClientId))
                            .build();
            idToken = verifier.verify(request.idToken);
        } catch (GeneralSecurityException | IOException e) {
            logger.error("Erro ao verificar token Google", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Erro ao verificar token: " + e.getMessage());
        }
        if (idToken == null) {
            logger.warn("Token Google inválido (idToken null após verify)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token Google inválido (assinatura ou audience incorretos)");
        }
        Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        Boolean emailVerified = (Boolean) payload.get("email_verified");
        logger.info("Token verificado. Email: {}, Verified: {}", email, emailVerified);
        
        if (email == null || email.isBlank() || emailVerified == null || !emailVerified) {
            logger.warn("Email inválido ou não verificado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email inválido ou não verificado pelo Google");
        }
        Optional<Profissional> profissionalOpt =
                profissionalRepository.findByEmailAndAtivoTrue(email);
        Profissional profissional;
        if (profissionalOpt.isPresent()) {
            profissional = profissionalOpt.get();
            logger.info("Profissional encontrado: {}", profissional.getId());
        } else {
            logger.info("Profissional não encontrado, iniciando auto-onboarding");
            // Se googleAutoOnboardingDefaultHospitalId <= 0 e não existe hospital padrão fixo, cria com 1
            if (googleAutoOnboardingDefaultHospitalId == null || googleAutoOnboardingDefaultHospitalId <= 0L) {
                 // Fallback para hospital 1 se a configuração estiver faltando
                 logger.warn("Hospital ID padrão não configurado, usando fallback 1");
                 googleAutoOnboardingDefaultHospitalId = 1L;
            }

            int atIndex = email.indexOf('@');
            if (atIndex < 0) {
                logger.warn("Email sem @");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email inválido (formato incorreto)");
            }
            String domain = email.substring(atIndex + 1).toLowerCase();
            
            // Validação de domínio opcional: se googleAutoOnboardingDomain estiver configurado, valida.
            // Se não estiver configurado (ou for nulo/vazio), permite qualquer domínio.
            if (googleAutoOnboardingDomain != null && !googleAutoOnboardingDomain.isBlank()) {
                String configuredDomain = googleAutoOnboardingDomain.toLowerCase();
                // Permite o domínio configurado OU gmail.com para facilitar testes/acesso pessoal
                if (!domain.equals(configuredDomain) && !domain.equals("gmail.com")) {
                     // Retorna erro se o domínio for exigido e não bater
                    logger.warn("Domínio inválido. Esperado: {}, Recebido: {}", configuredDomain, domain);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Domínio de email não autorizado: " + domain);
                }
            }
            
            Profissional novo = new Profissional();
            String nome = (String) payload.get("name");
            if (nome == null || nome.isBlank()) {
                String givenName = (String) payload.get("given_name");
                String familyName = (String) payload.get("family_name");
                StringBuilder sb = new StringBuilder();
                if (givenName != null && !givenName.isBlank()) {
                    sb.append(givenName);
                }
                if (familyName != null && !familyName.isBlank()) {
                    if (sb.length() > 0) {
                        sb.append(" ");
                    }
                    sb.append(familyName);
                }
                if (sb.length() > 0) {
                    nome = sb.toString();
                }
            }
            if (nome == null || nome.isBlank()) {
                nome = email;
            }
            novo.setNome(nome);
            novo.setCrm("");
            novo.setEmail(email);
            // Garante que o ID do hospital seja sempre válido, padrão 1 se não definido
            Long hospitalId = googleAutoOnboardingDefaultHospitalId != null && googleAutoOnboardingDefaultHospitalId > 0 
                ? googleAutoOnboardingDefaultHospitalId 
                : 1L;
            novo.setIdHospital(hospitalId);
            novo.setAtivo(true);
            novo.setPerfil("MEDICO");
            profissional = profissionalRepository.save(novo);
            logger.info("Novo profissional criado: {}", profissional.getId());
        }
        LoginResponse response = new LoginResponse();
        response.id = profissional.getId();
        response.nome = profissional.getNome();
        response.email = profissional.getEmail();
        response.idHospital = profissional.getIdHospital();
        String perfil = profissional.getPerfil();
        response.perfil = perfil != null && !perfil.isBlank() ? perfil : "MEDICO";
        response.token = jwtService.gerarToken(profissional);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!profissionalRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        profissionalRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
