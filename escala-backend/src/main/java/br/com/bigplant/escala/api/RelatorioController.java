package br.com.bigplant.escala.api;

import br.com.bigplant.escala.service.RelatorioService;
import br.com.bigplant.escala.service.RelatorioService.IndicadoresTrocaPeriodoDto;
import br.com.bigplant.escala.service.RelatorioService.ResumoProfissionalPeriodoDto;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    public RelatorioController(RelatorioService relatorioService) {
        this.relatorioService = relatorioService;
    }

    @GetMapping("/profissionais")
    public ResponseEntity<List<ResumoProfissionalPeriodoDto>> relatorioProfissionais(
            @RequestParam("idHospital") Long idHospital,
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(value = "tipoTurno", required = false) String tipoTurno) {
        return ResponseEntity.ok(
                relatorioService.resumoProfissionaisPorPeriodo(idHospital, inicio, fim, tipoTurno));
    }

    @GetMapping("/trocas")
    public ResponseEntity<IndicadoresTrocaPeriodoDto> relatorioTrocas(
            @RequestParam("idHospital") Long idHospital,
            @RequestParam("inicio") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam("fim") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(value = "tipoTurno", required = false) String tipoTurno) {
        return ResponseEntity.ok(
                relatorioService.indicadoresTrocasPorPeriodo(idHospital, inicio, fim, tipoTurno));
    }
}
