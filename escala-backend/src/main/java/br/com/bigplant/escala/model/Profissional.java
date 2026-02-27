package br.com.bigplant.escala.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "profissional")
public class Profissional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String crm;

    private Long idHospital;

    private Integer cargaHorariaMensalMaxima;

    private Integer cargaHorariaMensalMinima;

    private Boolean ativo;

    private String email;

    private String telefoneWhatsapp;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    private String perfil;

    private String fotoPerfil;

    @ManyToOne
    @JoinColumn(name = "id_instituicao")
    private InstituicaoOrganizacional instituicao;

    @ManyToOne
    @JoinColumn(name = "id_especialidade")
    private Especialidade especialidade;

    private Boolean divulgarDados;

    private java.time.LocalDate dataNascimento;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCrm() {
        return crm;
    }

    public void setCrm(String crm) {
        this.crm = crm;
    }

    public Long getIdHospital() {
        return idHospital;
    }

    public void setIdHospital(Long idHospital) {
        this.idHospital = idHospital;
    }

    public Integer getCargaHorariaMensalMaxima() {
        return cargaHorariaMensalMaxima;
    }

    public void setCargaHorariaMensalMaxima(Integer cargaHorariaMensalMaxima) {
        this.cargaHorariaMensalMaxima = cargaHorariaMensalMaxima;
    }

    public Integer getCargaHorariaMensalMinima() {
        return cargaHorariaMensalMinima;
    }

    public void setCargaHorariaMensalMinima(Integer cargaHorariaMensalMinima) {
        this.cargaHorariaMensalMinima = cargaHorariaMensalMinima;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefoneWhatsapp() {
        return telefoneWhatsapp;
    }

    public void setTelefoneWhatsapp(String telefoneWhatsapp) {
        this.telefoneWhatsapp = telefoneWhatsapp;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getPerfil() {
        return perfil;
    }

    public void setPerfil(String perfil) {
        this.perfil = perfil;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public InstituicaoOrganizacional getInstituicao() {
        return instituicao;
    }

    public void setInstituicao(InstituicaoOrganizacional instituicao) {
        this.instituicao = instituicao;
    }

    public Especialidade getEspecialidade() {
        return especialidade;
    }

    public void setEspecialidade(Especialidade especialidade) {
        this.especialidade = especialidade;
    }

    public Boolean getDivulgarDados() {
        return divulgarDados;
    }

    public void setDivulgarDados(Boolean divulgarDados) {
        this.divulgarDados = divulgarDados;
    }

    public java.time.LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(java.time.LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }
}
