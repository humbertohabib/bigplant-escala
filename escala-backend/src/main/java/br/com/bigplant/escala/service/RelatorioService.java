package br.com.bigplant.escala.service;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.model.Turno;
import br.com.bigplant.escala.repository.ProfissionalRepository;
import br.com.bigplant.escala.repository.TrocaPlantaoRepository;
import br.com.bigplant.escala.repository.TurnoRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RelatorioService {

    private final TurnoRepository turnoRepository;
    private final ProfissionalRepository profissionalRepository;
    private final TrocaPlantaoRepository trocaPlantaoRepository;

    public RelatorioService(
            TurnoRepository turnoRepository,
            ProfissionalRepository profissionalRepository,
            TrocaPlantaoRepository trocaPlantaoRepository) {
        this.turnoRepository = turnoRepository;
        this.profissionalRepository = profissionalRepository;
        this.trocaPlantaoRepository = trocaPlantaoRepository;
    }

    public List<ResumoProfissionalPeriodoDto> resumoProfissionaisPorPeriodo(
            Long idHospital, LocalDate inicio, LocalDate fim, String tipoTurno) {
        List<Turno> turnos =
                turnoRepository.findByIdHospitalAndDataBetween(idHospital, inicio, fim);
        Map<Long, AcumuladorProfissional> acumulado = new HashMap<>();
        for (Turno t : turnos) {
            if (t.getIdProfissional() == null) {
                continue;
            }
            if (tipoTurno != null
                    && !tipoTurno.isBlank()
                    && !"TODOS".equalsIgnoreCase(tipoTurno)
                    && (t.getTipo() == null || !tipoTurno.equalsIgnoreCase(t.getTipo()))) {
                continue;
            }
            Long idProfissional = t.getIdProfissional();
            AcumuladorProfissional acc =
                    acumulado.computeIfAbsent(idProfissional, k -> new AcumuladorProfissional());
            acc.totalPlantoes++;
            if ("NOITE".equalsIgnoreCase(t.getTipo())) {
                acc.totalNoites++;
            }
            LocalTime inicioHora = t.getHoraInicio();
            LocalTime fimHora = t.getHoraFim();
            int inicioMinutos = inicioHora.getHour() * 60 + inicioHora.getMinute();
            int fimMinutos = fimHora.getHour() * 60 + fimHora.getMinute();
            if (fimMinutos <= inicioMinutos) {
                fimMinutos += 24 * 60;
            }
            acc.minutosTotais += fimMinutos - inicioMinutos;
        }
        List<ResumoProfissionalPeriodoDto> resultado = new ArrayList<>();
        if (acumulado.isEmpty()) {
            return resultado;
        }
        List<Profissional> profissionais =
                profissionalRepository.findAllById(acumulado.keySet());
        Map<Long, Profissional> profissionaisPorId = new HashMap<>();
        for (Profissional p : profissionais) {
            profissionaisPorId.put(p.getId(), p);
        }
        for (Map.Entry<Long, AcumuladorProfissional> entry : acumulado.entrySet()) {
            Long idProfissional = entry.getKey();
            AcumuladorProfissional acc = entry.getValue();
            Profissional prof = profissionaisPorId.get(idProfissional);
            if (prof == null) {
                continue;
            }
            ResumoProfissionalPeriodoDto dto = new ResumoProfissionalPeriodoDto();
            dto.idProfissional = idProfissional;
            dto.nome = prof.getNome();
            dto.crm = prof.getCrm();
            dto.totalPlantoes = acc.totalPlantoes;
            dto.totalNoites = acc.totalNoites;
            dto.horasTotais = acc.minutosTotais / 60.0;
            dto.cargaMensalMinima = prof.getCargaHorariaMensalMinima();
            dto.cargaMensalMaxima = prof.getCargaHorariaMensalMaxima();
            resultado.add(dto);
        }
        return resultado;
    }

    public IndicadoresTrocaPeriodoDto indicadoresTrocasPorPeriodo(
            Long idHospital, LocalDate inicio, LocalDate fim, String tipoTurno) {
        LocalDateTime inicioDia = inicio.atStartOfDay();
        LocalDateTime fimDia = fim.atTime(LocalTime.of(23, 59, 59));
        List<TrocaPlantao> trocas =
                trocaPlantaoRepository.findByIdHospitalAndDataSolicitacaoBetween(
                        idHospital, inicioDia, fimDia);
        Map<Long, Turno> turnosPorId = new HashMap<>();
        if (tipoTurno != null && !"".equals(tipoTurno)) {
            List<Long> idsTurnos = new ArrayList<>();
            for (TrocaPlantao t : trocas) {
                if (t.getIdTurno() != null) {
                    idsTurnos.add(t.getIdTurno());
                }
            }
            if (!idsTurnos.isEmpty()) {
                List<Turno> turnos = turnoRepository.findAllById(idsTurnos);
                for (Turno turno : turnos) {
                    turnosPorId.put(turno.getId(), turno);
                }
            }
        }
        IndicadoresTrocaPeriodoDto dto = new IndicadoresTrocaPeriodoDto();
        Map<Long, ResumoTrocasProfissionalDto> porProfissional = new HashMap<>();
        for (TrocaPlantao t : trocas) {
            if (tipoTurno != null
                    && !tipoTurno.isBlank()
                    && !"TODOS".equalsIgnoreCase(tipoTurno)) {
                Turno turno = turnosPorId.get(t.getIdTurno());
                if (turno == null
                        || turno.getTipo() == null
                        || !tipoTurno.equalsIgnoreCase(turno.getTipo())) {
                    continue;
                }
            }
            dto.totalTrocas++;
            if ("SOLICITADA".equalsIgnoreCase(t.getStatus())) {
                dto.totalSolicitadas++;
            } else if ("APROVADA".equalsIgnoreCase(t.getStatus())) {
                dto.totalAprovadas++;
            } else if ("REJEITADA".equalsIgnoreCase(t.getStatus())) {
                dto.totalRejeitadas++;
            }
            Long idOrigem = t.getIdProfissionalOrigem();
            Long idDestino = t.getIdProfissionalDestino();
            if (idOrigem != null) {
                ResumoTrocasProfissionalDto r =
                        porProfissional.computeIfAbsent(
                                idOrigem,
                                k -> {
                                    ResumoTrocasProfissionalDto novo =
                                            new ResumoTrocasProfissionalDto();
                                    novo.idProfissional = k;
                                    return novo;
                                });
                r.comoOrigem++;
            }
            if (idDestino != null) {
                ResumoTrocasProfissionalDto r =
                        porProfissional.computeIfAbsent(
                                idDestino,
                                k -> {
                                    ResumoTrocasProfissionalDto novo =
                                            new ResumoTrocasProfissionalDto();
                                    novo.idProfissional = k;
                                    return novo;
                                });
                r.comoDestino++;
            }
        }
        if (!porProfissional.isEmpty()) {
            List<Profissional> profissionais =
                    profissionalRepository.findAllById(porProfissional.keySet());
            Map<Long, Profissional> profissionaisPorId = new HashMap<>();
            for (Profissional p : profissionais) {
                profissionaisPorId.put(p.getId(), p);
            }
            for (ResumoTrocasProfissionalDto r : porProfissional.values()) {
                Profissional p = profissionaisPorId.get(r.idProfissional);
                if (p != null) {
                    r.nome = p.getNome();
                    r.crm = p.getCrm();
                }
                dto.porProfissional.add(r);
            }
        }
        return dto;
    }

    private static class AcumuladorProfissional {

        int totalPlantoes;
        int totalNoites;
        long minutosTotais;
    }

    public static class ResumoProfissionalPeriodoDto {

        public Long idProfissional;
        public String nome;
        public String crm;
        public int totalPlantoes;
        public int totalNoites;
        public double horasTotais;
        public Integer cargaMensalMinima;
        public Integer cargaMensalMaxima;
    }

    public static class IndicadoresTrocaPeriodoDto {

        public int totalTrocas;
        public int totalSolicitadas;
        public int totalAprovadas;
        public int totalRejeitadas;
        public List<ResumoTrocasProfissionalDto> porProfissional = new ArrayList<>();
    }

    public static class ResumoTrocasProfissionalDto {

        public Long idProfissional;
        public String nome;
        public String crm;
        public int comoOrigem;
        public int comoDestino;
    }
}
