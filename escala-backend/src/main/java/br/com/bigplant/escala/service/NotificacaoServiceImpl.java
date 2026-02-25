package br.com.bigplant.escala.service;

import br.com.bigplant.escala.model.Profissional;
import br.com.bigplant.escala.model.TrocaPlantao;
import br.com.bigplant.escala.model.Turno;
import br.com.bigplant.escala.repository.TurnoRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificacaoServiceImpl implements NotificacaoService {

    private final TurnoRepository turnoRepository;

    private final DateTimeFormatter dataFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final DateTimeFormatter horaFormatter = DateTimeFormatter.ofPattern("HH:mm");

    public NotificacaoServiceImpl(TurnoRepository turnoRepository) {
        this.turnoRepository = turnoRepository;
    }

    @Override
    public void notificarTrocaSolicitada(TrocaPlantao troca, Profissional origem, Profissional destino, Turno turno) {
        String assunto =
                "Solicitação de troca - "
                        + turno.getData().format(dataFormatter)
                        + " "
                        + turno.getHoraInicio().format(horaFormatter)
                        + "-"
                        + turno.getHoraFim().format(horaFormatter);

        ResumoMensal resumoDestino =
                calcularResumoMensal(turno.getIdHospital(), destino, turno.getData());

        String mensagem =
                "Olá!\n"
                        + "\n"
                        + "Foi solicitada uma troca de plantão.\n"
                        + "\n"
                        + "Plantão:\n"
                        + "- Data: "
                        + turno.getData().format(dataFormatter)
                        + "\n"
                        + "- Horário: "
                        + turno.getHoraInicio().format(horaFormatter)
                        + " - "
                        + turno.getHoraFim().format(horaFormatter)
                        + "\n"
                        + "- Local: "
                        + turno.getLocal()
                        + "\n"
                        + "\n"
                        + "Origem: "
                        + origem.getNome()
                        + " (CRM "
                        + origem.getCrm()
                        + ")\n"
                        + "Destino: "
                        + destino.getNome()
                        + " (CRM "
                        + destino.getCrm()
                        + ")\n"
                        + "\n"
                        + "Resumo estimado da carga de "
                        + destino.getNome()
                        + " no mês "
                        + turno.getData().getMonthValue()
                        + "/"
                        + turno.getData().getYear()
                        + ":\n"
                        + "- Plantões atribuídos: "
                        + resumoDestino.totalPlantoes
                        + " ("
                        + resumoDestino.totalNoites
                        + " noites)\n"
                        + "- Carga horária estimada: "
                        + String.format("%.1f", resumoDestino.horasTotais)
                        + " h\n"
                        + (resumoDestino.cargaMin != null || resumoDestino.cargaMax != null
                                ? "- Limites configurados: "
                                        + (resumoDestino.cargaMin != null
                                                ? "mín "
                                                        + resumoDestino.cargaMin
                                                        + " h"
                                                : "")
                                        + (resumoDestino.cargaMin != null
                                                        && resumoDestino.cargaMax != null
                                                ? " / "
                                                : "")
                                        + (resumoDestino.cargaMax != null
                                                ? "máx "
                                                        + resumoDestino.cargaMax
                                                        + " h"
                                                : "")
                                        + "\n"
                                : "")
                        + "\n"
                        + "Motivo informado:\n"
                        + (troca.getMotivo() != null ? troca.getMotivo() : "-")
                        + "\n"
                        + "\n"
                        + "Mensagem automática do sistema de escala.";
        enviarEmail(origem.getEmail(), assunto, mensagem);
        enviarEmail(destino.getEmail(), assunto, mensagem);
        enviarWhatsapp(origem.getTelefoneWhatsapp(), mensagem);
        enviarWhatsapp(destino.getTelefoneWhatsapp(), mensagem);
    }

    @Override
    public void notificarTrocaAtualizada(TrocaPlantao troca, Profissional origem, Profissional destino, Turno turno) {
        String assunto =
                "Troca "
                        + troca.getStatus()
                        + " - "
                        + turno.getData().format(dataFormatter)
                        + " "
                        + turno.getHoraInicio().format(horaFormatter)
                        + "-"
                        + turno.getHoraFim().format(horaFormatter);

        ResumoMensal resumoDestino =
                calcularResumoMensal(turno.getIdHospital(), destino, turno.getData());

        String mensagem =
                "Olá!\n"
                        + "\n"
                        + "A seguinte troca de plantão foi "
                        + troca.getStatus()
                        + ".\n"
                        + "\n"
                        + "Plantão:\n"
                        + "- Data: "
                        + turno.getData().format(dataFormatter)
                        + "\n"
                        + "- Horário: "
                        + turno.getHoraInicio().format(horaFormatter)
                        + " - "
                        + turno.getHoraFim().format(horaFormatter)
                        + "\n"
                        + "- Local: "
                        + turno.getLocal()
                        + "\n"
                        + "\n"
                        + "Origem: "
                        + origem.getNome()
                        + " (CRM "
                        + origem.getCrm()
                        + ")\n"
                        + "Destino: "
                        + destino.getNome()
                        + " (CRM "
                        + destino.getCrm()
                        + ")\n"
                        + "\n"
                        + "Resumo estimado da carga de "
                        + destino.getNome()
                        + " no mês "
                        + turno.getData().getMonthValue()
                        + "/"
                        + turno.getData().getYear()
                        + ":\n"
                        + "- Plantões atribuídos: "
                        + resumoDestino.totalPlantoes
                        + " ("
                        + resumoDestino.totalNoites
                        + " noites)\n"
                        + "- Carga horária estimada: "
                        + String.format("%.1f", resumoDestino.horasTotais)
                        + " h\n"
                        + (resumoDestino.cargaMin != null || resumoDestino.cargaMax != null
                                ? "- Limites configurados: "
                                        + (resumoDestino.cargaMin != null
                                                ? "mín "
                                                        + resumoDestino.cargaMin
                                                        + " h"
                                                : "")
                                        + (resumoDestino.cargaMin != null
                                                        && resumoDestino.cargaMax != null
                                                ? " / "
                                                : "")
                                        + (resumoDestino.cargaMax != null
                                                ? "máx "
                                                        + resumoDestino.cargaMax
                                                        + " h"
                                                : "")
                                        + "\n"
                                : "")
                        + "\n"
                        + "Motivo informado:\n"
                        + (troca.getMotivo() != null ? troca.getMotivo() : "-")
                        + "\n"
                        + "\n"
                        + "Mensagem automática do sistema de escala.";
        enviarEmail(origem.getEmail(), assunto, mensagem);
        enviarEmail(destino.getEmail(), assunto, mensagem);
        enviarWhatsapp(origem.getTelefoneWhatsapp(), mensagem);
        enviarWhatsapp(destino.getTelefoneWhatsapp(), mensagem);
    }

    private ResumoMensal calcularResumoMensal(Long idHospital, Profissional profissional, LocalDate referencia) {
        LocalDate inicioMes = referencia.withDayOfMonth(1);
        LocalDate fimMes = referencia.withDayOfMonth(referencia.lengthOfMonth());
        List<Turno> turnosMes =
                turnoRepository.findByIdHospitalAndDataBetween(idHospital, inicioMes, fimMes);
        int totalPlantoes = 0;
        int totalNoites = 0;
        long minutosTotais = 0;
        for (Turno t : turnosMes) {
            if (t.getIdProfissional() == null || !t.getIdProfissional().equals(profissional.getId())) {
                continue;
            }
            totalPlantoes++;
            if ("NOITE".equalsIgnoreCase(t.getTipo())) {
                totalNoites++;
            }
            LocalTime inicio = t.getHoraInicio();
            LocalTime fim = t.getHoraFim();
            int inicioMinutos = inicio.getHour() * 60 + inicio.getMinute();
            int fimMinutos = fim.getHour() * 60 + fim.getMinute();
            if (fimMinutos <= inicioMinutos) {
                fimMinutos += 24 * 60;
            }
            minutosTotais += fimMinutos - inicioMinutos;
        }
        double horasTotais = minutosTotais / 60.0;
        ResumoMensal resumo = new ResumoMensal();
        resumo.totalPlantoes = totalPlantoes;
        resumo.totalNoites = totalNoites;
        resumo.horasTotais = horasTotais;
        resumo.cargaMin = profissional.getCargaHorariaMensalMinima();
        resumo.cargaMax = profissional.getCargaHorariaMensalMaxima();
        return resumo;
    }

    private void enviarEmail(String destinatario, String assunto, String mensagem) {
        if (destinatario == null || destinatario.isBlank()) {
            return;
        }
        System.out.println("EMAIL para " + destinatario + " | " + assunto + " | " + mensagem);
    }

    private void enviarWhatsapp(String numero, String mensagem) {
        if (numero == null || numero.isBlank()) {
            return;
        }
        System.out.println("WHATSAPP para " + numero + " | " + mensagem);
    }

    private static class ResumoMensal {

        int totalPlantoes;
        int totalNoites;
        double horasTotais;
        Integer cargaMin;
        Integer cargaMax;
    }
}
