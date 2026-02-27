import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, Save, Lock, Mail, Phone, Calendar, Eye, EyeOff, User, Shield } from 'lucide-react'
import type { UsuarioAutenticado, Profissional } from '../../types'

interface MeuPerfilModalProps {
  isOpen: boolean
  onClose: () => void
  usuario: UsuarioAutenticado
  onUpdateUser: (usuario: UsuarioAutenticado) => void
  apiBaseUrl: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

export const MeuPerfilModal: React.FC<MeuPerfilModalProps> = ({
  isOpen,
  onClose,
  usuario,
  onUpdateUser,
  apiBaseUrl,
  authFetch
}) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Profissional>({
    nome: '',
    email: '',
    telefoneWhatsapp: '',
    dataNascimento: '',
    divulgarDados: true,
    senha: '',
    idHospital: 1, // Default
    fotoPerfil: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && usuario.id) {
      fetchProfile()
    }
  }, [isOpen, usuario.id])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFetch(`${apiBaseUrl}/api/profissionais/${usuario.id}`)
      if (!response.ok) throw new Error('Erro ao carregar perfil')
      
      const data: Profissional = await response.json()
      setFormData({
        ...data,
        senha: '', // Don't show password hash
        divulgarDados: data.divulgarDados ?? true // Default true if null
      })
    } catch (err) {
      setError('Não foi possível carregar os dados do perfil.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData(prev => ({ ...prev, fotoPerfil: base64String }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Prepare payload
      const payload = { ...formData }
      if (!payload.senha) delete payload.senha // Don't send empty password
      
      const response = await authFetch(`${apiBaseUrl}/api/profissionais/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Erro ao salvar alterações')
      
      const updatedUser: Profissional = await response.json()
      
      // Update local user state in App
      onUpdateUser({
        ...usuario,
        nome: updatedUser.nome,
        email: updatedUser.email || usuario.email,
        fotoPerfil: updatedUser.fotoPerfil
      })
      
      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => {
        setSuccess(null)
        onClose()
      }, 1500)
      
    } catch (err) {
      setError('Erro ao salvar alterações. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Meu Perfil</h2>
            <p className="text-sm text-gray-500">Gerencie suas informações pessoais e preferências</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                <span className="font-medium">Sucesso!</span> {success}
              </div>
            )}

            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {formData.fotoPerfil ? (
                  <img 
                    src={formData.fotoPerfil} 
                    alt="Foto" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Alterar foto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="telefoneWhatsapp"
                    value={formData.telefoneWhatsapp || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Data Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="dataNascimento"
                    value={formData.dataNascimento || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (opcional)</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="senha"
                    value={formData.senha || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Deixe em branco para manter"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Privacidade */}
              <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {formData.divulgarDados ? (
                      <Eye size={20} className="text-blue-600" />
                    ) : (
                      <EyeOff size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-2 font-medium text-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="divulgarDados"
                        checked={formData.divulgarDados !== false}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      Permitir divulgação de contato
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Quando marcado, seu email e telefone serão visíveis para outros usuários no calendário e na lista de profissionais.
                      Se desmarcado, apenas administradores poderão ver seus dados de contato.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instituição (Read-only) */}
              {formData.instituicao && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instituição Vinculada</label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 flex items-center gap-2">
                    <Shield size={16} className="text-gray-400" />
                    <span>{formData.instituicao.nome}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
