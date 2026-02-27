package br.com.bigplant.escala.service;

import br.com.bigplant.escala.dto.DadosGeracaoEscalaDTO;
import br.com.bigplant.escala.model.Escala;
import br.com.bigplant.escala.model.Turno;
import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.Disponibilidade;
import br.com.bigplant.escala.model.RegraEscalaParametro;
import br.com.bigplant.escala.repository.EscalaRepository;
import br.com.bigplant.escala.repository.TurnoRepository;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.repository.DisponibilidadeRepository;
import br.com.bigplant.escala.repository.RegraEscalaParametroRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GeracaoEscalaService {

    private final EscalaRepository escalaRepository;
    private final TurnoRepository turnoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final DisponibilidadeRepository disponibilidadeRepository;
    private final RegraEscalaParametroRepository regraEscalaParametroRepository;

    public GeracaoEscalaService(
            EscalaRepository escalaRepository,
            TurnoRepository turnoRepository,
            ProfissionalRepository profissionalRepository,
            DisponibilidadeRepository disponibilidadeRepository,
            RegraEscalaParametroRepository regraEscalaParametroRepository) {
        this.escalaRepository = escalaRepository;
        this.turnoRepository = turnoRepository;
        this.profissionalRepository = profissionalRepository;
        this.disponibilidadeRepository = disponibilidadeRepository;
        this.regraEscalaParametroRepository = regraEscalaParametroRepository;
    }

    @Transactional
    public Escala gerarEscalaProximosQuinzeDias(Long idHospital, DadosGeracaoEscalaDTO dados) {
        LocalDate hoje = LocalDate.now();
        LocalDate dataFim = hoje.plusDays(15);

        Escala escala = new Escala();
        escala.setIdHospital(idHospital);
        escala.setDataInicio(hoje);
        escala.setDataFim(dataFim);
        escala.setStatus("GERADA");

        List<Turno> turnos = new ArrayList<>();

        LocalDate data = hoje;
        while (!data.isAfter(dataFim)) {
            Turno turnoDia = new Turno();
            turnoDia.setData(data);
            turnoDia.setHoraInicio(LocalTime.of(7, 0));
            turnoDia.setHoraFim(LocalTime.of(19, 0));
            turnoDia.setTipo("DIA");
            turnoDia.setLocal("Hospital Principal");
            turnoDia.setIdHospital(idHospital);
            turnoDia.setEscala(escala);
            turnos.add(turnoDia);

            Turno turnoNoite = new Turno();
            turnoNoite.setData(data);
            turnoNoite.setHoraInicio(LocalTime.of(19, 0));
            turnoNoite.setHoraFim(LocalTime.of(7, 0));
            turnoNoite.setTipo("NOITE");
            turnoNoite.setLocal("Hospital Principal");
            turnoNoite.setIdHospital(idHospital);
            turnoNoite.setEscala(escala);
            turnos.add(turnoNoite);

            data = data.plusDays(1);
        }

        aplicarRegrasEAlocarProfissionais(idHospital, hoje, dataFim, turnos, dados);

        escala.setTurnos(turnos);

        Escala escalaSalva = escalaRepository.save(escala);
        // turnoRepository.saveAll(turnos); // CascadeType.ALL already handles this

        return escalaSalva;
    }

    public Optional<Escala> buscarUltimaEscala(Long idHospital) {
        return escalaRepository.findTopByIdHospitalOrderByDataInicioDesc(idHospital);
    }

    @Transactional
    public void excluirEscala(Long id) {
        if (escalaRepository.existsById(id)) {
            escalaRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Escala não encontrada");
        }
    }

    private void aplicarRegrasEAlocarProfissionais(
            Long idHospital, LocalDate inicio, LocalDate fim, List<Turno> turnos, DadosGeracaoEscalaDTO dados) {
        List<Profissional> profissionais = profissionalRepository.findByIdHospitalAndAtivoTrue(idHospital);
        
        // Filtrar por profissionais se fornecido
        if (dados.getIdsProfissionais() != null && !dados.getIdsProfissionais().isEmpty()) {
            profissionais = profissionais.stream()
                .filter(p -> dados.getIdsProfissionais().contains(p.getId()))
                .collect(Collectors.toList());
        }

        // Filtrar por especialidades se fornecido
        if (dados.getIdsEspecialidades() != null && !dados.getIdsEspecialidades().isEmpty()) {
            profissionais = profissionais.stream()
                .filter(p -> p.getEspecialidade() != null && dados.getIdsEspecialidades().contains(p.getEspecialidade().getId()))
                .collect(Collectors.toList());
        }

        if (profissionais.isEmpty()) {
            return;
        }

        // Pre-buscar turnos existentes para validação de conflito
        List<Turno> turnosExistentes = turnoRepository.findByIdHospitalAndDataBetween(idHospital, inicio.minusDays(1), fim.plusDays(1));
        Map<Long, List<Turno>> turnosExistentesMap = turnosExistentes.stream()
                .collect(Collectors.groupingBy(Turno::getIdProfissional));

        Long idRegraConfiguracao = dados.getIdRegraConfiguracao();
        List<RegraEscalaParametro> regras;
        if (idRegraConfiguracao != null) {
            regras = regraEscalaParametroRepository.findByRegraConfiguracaoId(idRegraConfiguracao);
        } else {
            regras = regraEscalaParametroRepository
                    .findByIdHospitalAndAtivoAndDataInicioVigenciaLessThanEqualAndDataFimVigenciaIsNullOrDataFimVigenciaGreaterThanEqual(
                            idHospital, true, inicio, inicio);
        }

        int maxNoitesMes = obterValorInteiroRegras(regras, "MAX_NOITES_MES", 0);
        int minDescansoHoras = obterValorInteiroRegras(regras, "MIN_DESCANSO_HORAS", 0);
        int maxPlantoesConsecutivos = obterValorInteiroRegras(regras, "MAX_PLANTOES_CONSECUTIVOS", 0);

        Map<Long, Integer> noitesPorProfissional = new HashMap<>();
        Map<Long, LocalDateTime> ultimaSaidaPorProfissional = new HashMap<>();
        Map<Long, Integer> plantoesConsecutivosPorProfissional = new HashMap<>();
        Map<Long, LocalDate> ultimaDataComPlantaoPorProfissional = new HashMap<>();

        List<Turno> turnosOrdenados = turnos.stream()
                .sorted(Comparator.comparing(Turno::getData).thenComparing(Turno::getHoraInicio))
                .toList();

        for (Turno turno : turnosOrdenados) {
            List<Disponibilidade> disponibilidades = disponibilidadeRepository
                    .findByIdHospitalAndDataAndTipoTurnoAndDisponivelTrue(
                            idHospital, turno.getData(), turno.getTipo());

            Set<Long> idsDisponiveis = disponibilidades.isEmpty()
                    ? profissionais.stream().map(Profissional::getId).collect(Collectors.toSet())
                    : disponibilidades.stream().map(Disponibilidade::getIdProfissional).collect(Collectors.toSet());

            List<Profissional> candidatos = profissionais.stream()
                    .filter(p -> idsDisponiveis.contains(p.getId()))
                    .collect(Collectors.toList());

            if (candidatos.isEmpty()) {
                continue;
            }

            LocalDateTime inicioTurno = LocalDateTime.of(turno.getData(), turno.getHoraInicio());
            LocalDateTime fimTurno = calcularFimTurno(turno);

            // Filtro Hard: Sem Conflito
            List<Profissional> semConflito = candidatos.stream()
                    .filter(p -> !temConflitoHorario(p.getId(), turno, turnosExistentesMap))
                    .collect(Collectors.toList());
            
            if (semConflito.isEmpty()) {
                continue;
            }

            // Filtros Soft: Regras
            List<Profissional> candidatosFiltrados = semConflito.stream()
                    .filter(p -> respeitaDescanso(p.getId(), inicioTurno, ultimaSaidaPorProfissional, minDescansoHoras))
                    .filter(p -> respeitaMaxNoites(turno, p.getId(), noitesPorProfissional, maxNoitesMes))
                    .filter(p -> respeitaMaxPlantoesConsecutivos(
                            p.getId(),
                            turno.getData(),
                            plantoesConsecutivosPorProfissional,
                            ultimaDataComPlantaoPorProfissional,
                            maxPlantoesConsecutivos))
                    .collect(Collectors.toList());

            if (candidatosFiltrados.isEmpty()) {
                candidatosFiltrados = semConflito;
            }

            Profissional escolhido = candidatosFiltrados.stream()
                    .min(Comparator.comparing(p -> cargaAtualEstimativa(p.getId(), turnos)))
                    .orElse(candidatosFiltrados.get(0));

            turno.setIdProfissional(escolhido.getId());
            ultimaSaidaPorProfissional.put(escolhido.getId(), fimTurno);

            LocalDate ultimaData = ultimaDataComPlantaoPorProfissional.get(escolhido.getId());
            int plantoesConsecutivosAtuais = plantoesConsecutivosPorProfissional.getOrDefault(escolhido.getId(), 0);
            if (ultimaData == null) {
                plantoesConsecutivosAtuais = 1;
            } else {
                long diasEntre = ChronoUnit.DAYS.between(ultimaData, turno.getData());
                if (diasEntre == 1) {
                    plantoesConsecutivosAtuais = plantoesConsecutivosAtuais + 1;
                } else if (diasEntre > 1) {
                    plantoesConsecutivosAtuais = 1;
                }
            }
            plantoesConsecutivosPorProfissional.put(escolhido.getId(), plantoesConsecutivosAtuais);
            ultimaDataComPlantaoPorProfissional.put(escolhido.getId(), turno.getData());

            if ("NOITE".equalsIgnoreCase(turno.getTipo())) {
                int atual = noitesPorProfissional.getOrDefault(escolhido.getId(), 0);
                noitesPorProfissional.put(escolhido.getId(), atual + 1);
            }
        }
    }

    private boolean temConflitoHorario(Long idProfissional, Turno novoTurno, Map<Long, List<Turno>> turnosExistentesMap) {
        List<Turno> existentes = turnosExistentesMap.get(idProfissional);
        if (existentes == null || existentes.isEmpty()) {
            return false;
        }

        LocalDateTime novoInicio = LocalDateTime.of(novoTurno.getData(), novoTurno.getHoraInicio());
        LocalDateTime novoFim = calcularFimTurno(novoTurno);

        for (Turno existente : existentes) {
            LocalDateTime existenteInicio = LocalDateTime.of(existente.getData(), existente.getHoraInicio());
            LocalDateTime existenteFim = calcularFimTurno(existente);

            if (novoInicio.isBefore(existenteFim) && novoFim.isAfter(existenteInicio)) {
                return true;
            }
        }
        return false;
    }

    private int obterValorInteiroRegras(List<RegraEscalaParametro> regras, String chave, int valorPadrao) {
        return regras.stream()
                .filter(r -> chave.equalsIgnoreCase(r.getChave()))
                .map(RegraEscalaParametro::getValorInteiro)
                .filter(v -> v != null && v > 0)
                .findFirst()
                .orElse(valorPadrao);
    }

    private LocalDateTime calcularFimTurno(Turno turno) {
        LocalDate dataFim = turno.getData();
        if (turno.getHoraFim().isBefore(turno.getHoraInicio())) {
            dataFim = dataFim.plusDays(1);
        }
        return LocalDateTime.of(dataFim, turno.getHoraFim());
    }

    private boolean respeitaDescanso(
            Long idProfissional,
            LocalDateTime inicioTurno,
            Map<Long, LocalDateTime> ultimaSaidaPorProfissional,
            int minDescansoHoras) {
        if (minDescansoHoras <= 0) {
            return true;
        }
        LocalDateTime ultimaSaida = ultimaSaidaPorProfissional.get(idProfissional);
        if (ultimaSaida == null) {
            return true;
        }
        LocalDateTime minimoPermitido = ultimaSaida.plusHours(minDescansoHoras);
        return !inicioTurno.isBefore(minimoPermitido);
    }

    private boolean respeitaMaxNoites(
            Turno turno, Long idProfissional, Map<Long, Integer> noitesPorProfissional, int maxNoitesMes) {
        if (maxNoitesMes <= 0) {
            return true;
        }
        if (!"NOITE".equalsIgnoreCase(turno.getTipo())) {
            return true;
        }
        int atual = noitesPorProfissional.getOrDefault(idProfissional, 0);
        return atual < maxNoitesMes;
    }

    private boolean respeitaMaxPlantoesConsecutivos(
            Long idProfissional,
            LocalDate dataTurno,
            Map<Long, Integer> plantoesConsecutivosPorProfissional,
            Map<Long, LocalDate> ultimaDataComPlantaoPorProfissional,
            int maxPlantoesConsecutivos) {
        if (maxPlantoesConsecutivos <= 0) {
            return true;
        }
        LocalDate ultimaData = ultimaDataComPlantaoPorProfissional.get(idProfissional);
        if (ultimaData == null) {
            return true;
        }
        long diasEntre = ChronoUnit.DAYS.between(ultimaData, dataTurno);
        if (diasEntre == 1) {
            int atual = plantoesConsecutivosPorProfissional.getOrDefault(idProfissional, 1);
            return atual < maxPlantoesConsecutivos;
        }
        if (diasEntre > 1) {
            return true;
        }
        return true;
    }

    private int cargaAtualEstimativa(Long idProfissional, List<Turno> turnos) {
        return (int)
                turnos.stream()
                        .filter(t -> idProfissional.equals(t.getIdProfissional()))
                        .count();
    }
}
