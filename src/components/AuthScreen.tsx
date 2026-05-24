import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import { Activity, Lock, Mail, Eye, EyeOff, Sparkles, LogIn, UserPlus, Copy, Check, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Custom states for Firebase domain authorization error handling
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Check Redirect results on load (important for mobile/Safari redirect flows)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          onLoginSuccess?.();
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleAuthError = (err: any) => {
    let localizedMsg = 'Ocorreu um erro ao conectar com o Google.';
    console.log("Error Details:", err.code, err.message);

    if (err.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      setUnauthorizedDomain(currentHost);
      localizedMsg = `Domínio não autorizado. O domínio "${currentHost}" precisa ser adicionado no Console do Firebase.`;
    } else if (err.code === 'auth/popup-blocked') {
      localizedMsg = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, ative os pop-ups ou use o botão para Celular/Redirecionamento.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      localizedMsg = ''; // Silenced
    } else if (err.code === 'auth/network-request-failed') {
      localizedMsg = 'Erro de rede. Verifique sua conexão à internet e tente novamente.';
    } else {
      localizedMsg = `Erro no login com Google (${err.code || 'Desconhecido'}): ${err.message || 'Contate o suporte.'}`;
    }

    if (localizedMsg) {
      setErrorMsg(localizedMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess?.();
    } catch (err: any) {
      console.error(err);
      let localizedMsg = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/wrong-password') {
        localizedMsg = 'Senha incorreta. Tente novamente.';
      } else if (err.code === 'auth/user-not-found') {
        localizedMsg = 'Usuário não cadastrado.';
      } else if (err.code === 'auth/email-already-in-use') {
        localizedMsg = 'Este e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/weak-password') {
        localizedMsg = 'A senha precisa ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        localizedMsg = 'Formato de e-mail inválido.';
      } else if (err.code === 'auth/invalid-credential') {
        localizedMsg = 'E-mail ou senha inválidos.';
      } else if (err.code === 'auth/operation-not-allowed') {
        localizedMsg = 'O login por e-mail/senha não está ativado na configuração do Firebase Auth.';
      } else {
        localizedMsg = `Erro (${err.code || 'Desconhecido'}): ${err.message || 'Contate o suporte.'}`;
      }
      setErrorMsg(localizedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setUnauthorizedDomain(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      onLoginSuccess?.();
    } catch (err: any) {
      console.error(err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginRedirect = async () => {
    setLoading(true);
    setErrorMsg('');
    setUnauthorizedDomain(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error(err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (!unauthorizedDomain) return;
    navigator.clipboard.writeText(unauthorizedDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/[0.04] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/[0.04] rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 rounded-2xl text-white shadow-xl shadow-indigo-600/10 mb-4">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            Gestão<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent font-black">Gale</span>
          </h1>
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-1">
            Controle de Banca Inteligente
          </p>
        </div>

        <motion.div 
          className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
          layout
        >
          {/* Section Indicator badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-4 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 shadow-md">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>{isSignUp ? 'Criar Nova Conta' : 'Acessar Conta'}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">E-mail</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1.5">Senha</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Registrar e Entrar</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Acessar Aplicativo</span>
                </>
              )}
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-800/80"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Ou</span>
              <div className="flex-grow border-t border-slate-800/80"></div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-1 text-white shrink-0" viewBox="0 0 24 24" width="24" height="24">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4c0,-0.37 -0.03,-0.74 -0.08,-1H21.35z" fill="#4285F4"/>
                    <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.97 -3.33,0.97c-2.56,0 -4.73,-1.73 -5.5,-4.06H2.43v2.6C3.93,18.3 7.7,20.6 12,20.6z" fill="#34A853"/>
                    <path d="M6.5,12.7c-0.2,-0.6 -0.3,-1.25 -0.3,-1.9c0,-0.65 0.1,-1.3 0.3,-1.9V6.3H2.43C1.65,7.9 1.2,9.75 1.2,11.7c0,1.95 0.45,3.8 1.23,5.4L6.5,12.7z" fill="#FBBC05"/>
                    <path d="M12,5.2c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.43,1.7 12,1.7C7.7,1.7 3.93,4 2.43,6.3L6.5,8.9C7.27,6.57 9.44,5.2 12,5.2z" fill="#EA4335"/>
                  </g>
                </svg>
                <span>Conectar via Pop-up (Computador)</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleLoginRedirect}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-950/20 hover:bg-indigo-900/40 border border-indigo-900/60 text-indigo-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-1 text-indigo-400 shrink-0 animate-pulse" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4c0,-0.37 -0.03,-0.74 -0.08,-1H21.35z" fill="currentColor"/>
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.97 -3.33,0.97c-2.56,0 -4.73,-1.73 -5.5,-4.06H2.43v2.6C3.93,18.3 7.7,20.6 12,20.6z" fill="currentColor"/>
                  <path d="M6.5,12.7c-0.2,-0.6 -0.3,-1.25 -0.3,-1.9c0,-0.65 0.1,-1.3 0.3,-1.9V6.3H2.43C1.65,7.9 1.2,9.75 1.2,11.7c0,1.95 0.45,3.8 1.23,5.4L6.5,12.7z" fill="currentColor"/>
                  <path d="M12,5.2c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.43,1.7 12,1.7C7.7,1.7 3.93,4 2.43,6.3L6.5,8.9C7.27,6.57 9.44,5.2 12,5.2z" fill="currentColor"/>
                </svg>
                <span>Usar Redirecionamento (Celular / Vercel)</span>
              </button>
            </div>

            {unauthorizedDomain && (
              <div className="mt-4 p-4.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <HelpCircle className="h-16 w-16 text-amber-500 pointer-events-none" />
                </div>

                <div className="flex items-start gap-2 text-amber-400">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5 animate-bounce" />
                  <span className="text-[11px] font-black tracking-wider uppercase">Como Configurar na Vercel:</span>
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  O Google exige que o seu link da Vercel seja registrado como um domínio seguro em seu projeto Firebase para autorizar o login:
                </p>

                <ol className="text-[11px] text-slate-300 space-y-2 list-decimal list-inside font-semibold leading-relaxed">
                  <li>
                    Acesse o seu <a 
                      href={`https://console.firebase.google.com/project/charming-respect-m8gvj/authentication/providers`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-400 underline hover:text-indigo-300 font-bold transition-colors inline-flex items-center gap-0.5"
                    >
                      Console do Firebase
                    </a>.
                  </li>
                  <li>
                    Acesse <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">Authentication</span> &gt; aba <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">Configurações</span> (Settings) &gt; <span className="text-white bg-slate-950 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">Domínios Autorizados</span>.
                  </li>
                  <li>
                    Clique em **Adicionar Domínio** e cole ou digite o link do seu site da Vercel:
                    <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-amber-300 select-all font-bold tracking-tight">
                      <span className="break-all flex-grow">{unauthorizedDomain}</span>
                      <button
                        type="button"
                        onClick={handleCopyDomain}
                        className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copiar domínio"
                      >
                        {copiedDomain ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    Salve, aguarde cerca de 1 minuto para o cache do Firebase limpar, e tente o login novamente!
                  </li>
                </ol>
              </div>
            )}
          </form>

          <div className="mt-6 text-center select-none text-xs text-slate-400 font-semibold">
            {isSignUp ? (
              <p>
                Já possui uma conta?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-indigo-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Entrar aqui
                </button>
              </p>
            ) : (
              <p>
                Novo por aqui?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                  }}
                  className="text-indigo-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Criar conta grátis
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
