import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

// ── Logo Geothra (SVG inline fiel ao manual de marca) ─────────────────────
function LogoGeothra({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Quadrado superior — amarelo */}
      <rect x="0" y="0"  width="72" height="36" fill="#E6D352" />
      {/* Quadrado inferior — ouro */}
      <rect x="0" y="36" width="72" height="36" fill="#B29312" />
      {/* Monograma GR em branco */}
      <text
        x="36" y="46"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="28"
        fill="white"
        letterSpacing="-1"
      >
        GR
      </text>
    </svg>
  )
}

// ── Ícones ─────────────────────────────────────────────────────────────────
function IconEmail() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="11" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [mostrar,  setMostrar]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')
  const [shake,    setShake]    = useState(false)

  const formRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, senha })
      login(data.access_token, data.nome, data.role)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Erro ao conectar ao servidor'
      setErro(msg)
      // Animação de shake no card
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Painel esquerdo — identidade Geothra ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center px-12 relative overflow-hidden">

        {/* Detalhe decorativo — círculo neutro no canto */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-white opacity-5" />

        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <LogoGeothra size={88} />

          <div>
            <h1 className="text-white text-3xl font-bold tracking-tight leading-tight">
              GEOTHRA
            </h1>
            <p className="text-accent text-sm font-medium tracking-widest uppercase mt-1">
              Geologia &amp; Geotecnia
            </p>
          </div>

          <div className="w-12 h-px bg-accent opacity-40" />

          <div className="text-primary-100 text-center">
            <p className="text-lg font-medium text-white leading-snug">
              Sistema de Acompanhamento<br />de Sondagens
            </p>
          </div>
        </div>

        {/* Rodapé do painel */}
        <p className="absolute bottom-6 text-xs text-white opacity-30">
          © {new Date().getFullYear()} Geothra. Todos os direitos reservados.
        </p>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="lg:w-1/2 flex-1 flex items-center justify-center px-6 py-12 relative" style={{background: 'radial-gradient(circle at 1px 1px, #003440 1px, transparent 0)', backgroundSize: '28px 28px', backgroundColor: '#f8fafb'}}>
        <div className="w-full max-w-md">

          {/* Logo mobile (visível só em telas pequenas) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <LogoGeothra size={56} />
            <h2 className="mt-3 text-primary font-bold text-xl">GEOTHRA</h2>
            <p className="text-xs text-gray-500 tracking-wider uppercase">Geologia &amp; Geotecnia</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo</h2>
            <p className="text-sm text-gray-500 mt-1">Entre com suas credenciais para acessar</p>
          </div>

          {/* Card do form com animação de shake */}
          <div
            ref={formRef}
            className={`bg-white rounded-2xl shadow-card border border-gray-100 p-8 transition-all ${shake ? 'animate-shake' : ''}`}
          >
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconEmail />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="label" htmlFor="senha">Senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconLock />
                  </span>
                  <input
                    id="senha"
                    type={mostrar ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <IconEye open={mostrar} />
                  </button>
                </div>
              </div>

              {/* Mensagem de erro */}
              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <p className="text-sm text-red-600">{erro}</p>
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={loading || !email || !senha}
                className="btn-primary w-full justify-center flex items-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Entrando…
                  </>
                ) : 'Entrar'}
              </button>

            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            v1.0 · Geothra © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
