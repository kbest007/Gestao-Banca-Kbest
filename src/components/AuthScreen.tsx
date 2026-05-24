import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Activity, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  RefreshCw, 
  Send,
  LogOut,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Check Redirect results on load (very helpful for mobile devices / Safari where popups fail)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const isGoogle = result.user.providerData.some(p => p.providerId === 'google.com');
          if (result.user.emailVerified || isGoogle) {
            onLoginSuccess(result.user);
          }
        }
      } catch (err: any) {
        console.error("Redirect Result Error:", err);
        handleLocalError(err);
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, [onLoginSuccess]);

  // Monitor auth state to detect state changes & verification updates
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
        if (user.emailVerified || isGoogle) {
          onLoginSuccess(user);
        } else {
          setMode('verify');
        }
      } else {
        if (mode === 'verify') {
          setMode('login');
        }
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess, mode]);

  // Handle countdown for resending verification email
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleLocalError = (err: any) => {
    console.error("Auth Error:", err);
    let msg = 'Ocorreu um erro inesperado.';
    
    if (err.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      setUnauthorizedDomain(currentHost);
      msg = `Domínio não autorizado pelo Firebase. O domínio "${currentHost}" precisa ser adicionado no Console do seu Firebase de forma gratuita.`;
    } else if (err.code === 'auth/popup-blocked') {
      msg = 'O pop-up de login foi bloqueado pelo seu dispositivo celular ou navegador. Por favor, ative os pop-ups ou utilize a opção "Entrar com Google (Celular/Redirecionar)".';
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = ''; // Silently close
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Endereço de e-mail inválido.';
    } else if (err.code === 'auth/user-disabled') {
      msg = 'Esta conta foi desativada.';
    } else if (err.code === 'auth/user-not-found') {
      msg = 'Nenhum usuário encontrado com este e-mail.';
    } else if (err.code === 'auth/wrong-password') {
      msg = 'Senha incorreta. Tente novamente.';
    } else if (err.code === 'auth/email-already-in-use') {
      msg = 'Este endereço de e-mail já está sendo usado.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Sua senha deve ter no mínimo 6 caracteres.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Muitas tentativas malsucedidas. Tente mais tarde.';
    } else if (err.code === 'auth/invalid-credential') {
      msg = 'E-mail ou senha incorretos.';
    } else {
      msg = err.message || msg;
    }
    
    if (msg) {
      setErrorMsg(msg);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    clearMessages();
    setUnauthorizedDomain(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginRedirect = async () => {
    setLoading(true);
    clearMessages();
    setUnauthorizedDomain(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      handleLocalError(err);
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

  const clearMessages = () => {
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      if (user.emailVerified) {
        onLoginSuccess(user);
      } else {
        setMode('verify');
        setErrorMsg('Por favor, ative sua conta através do link enviado ao seu e-mail.');
      }
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    clearMessages();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Send verified email link
      await sendEmailVerification(result.user);
      setMode('verify');
      setInfoMsg('Sua conta foi criada! Enviamos um link de confirmação para seu e-mail.');
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Digite seu e-mail de recuperação.');
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg('E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser || cooldown > 0) return;
    setLoading(true);
    clearMessages();
    try {
      await sendEmailVerification(currentUser);
      setInfoMsg('Novo e-mail de confirmação enviado!');
      setCooldown(60);
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!currentUser) return;
    setLoading(true);
    clearMessages();
    try {
      // Reload current authenticated user info to fetch current verified state from Firebase servers
      await currentUser.reload();
      const reloadedUser = auth.currentUser;
      if (reloadedUser && reloadedUser.emailVerified) {
        setInfoMsg('Excelente! Seu e-mail foi confirmado.');
        setTimeout(() => {
          onLoginSuccess(reloadedUser);
        }, 1500);
      } else {
        setErrorMsg('O e-mail ainda não foi confirmado. Verifique sua caixa de entrada/spam e clique no link.');
      }
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    clearMessages();
    try {
      await signOut(auth);
      setCurrentUser(null);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Premium ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-600/[0.04] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-emerald-500/[0.03] rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* App Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 rounded-2xl text-white shadow-xl shadow-indigo-600/10 mb-4 animate-pulse">
            <Activity className="h-6.5 w-6.5" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            Gestão<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Gale</span>
          </h2>
          <span className="text-[10px] text-indigo-400/90 font-extrabold block uppercase tracking-widest leading-none mt-1.5 font-mono">
            Controle de Banca Inteligente
          </span>
        </div>

        {/* Card Body */}
        <motion.div 
          layout
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/20"
        >
          {/* Messages Alerts */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl flex items-start gap-2.5 font-semibold leading-relaxed"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {infoMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs rounded-2xl flex items-start gap-2.5 font-semibold leading-relaxed"
              >
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </motion.div>
            )}

            {unauthorizedDomain && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left"
              >
                <div className="flex gap-2 items-start text-amber-400 font-extrabold text-xs mb-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Configuração de Domínio Necessária!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  Para permitir o login do Google no seu link, adicione o domínio temporário ou final no painel do seu Firebase (Totalmente Gratuito):
                </p>
                <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1.5 mb-4 font-semibold">
                  <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">Console do Firebase</a></li>
                  <li>Clique no seu projeto, vá em <strong className="text-slate-200">Authentication &gt; Configurações (Settings) &gt; Domínios Autorizados (Authorized Domains)</strong></li>
                  <li>Clique em <strong className="text-slate-200">Adicionar Domínio</strong> e cole o link abaixo:</li>
                </ol>
                
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-400 select-all justify-between leading-none mb-2">
                  <span className="truncate">{unauthorizedDomain}</span>
                  <button 
                    onClick={handleCopyDomain}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedDomain ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span className="text-[9px] font-sans font-bold">{copiedDomain ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <h3 className="text-lg font-black tracking-tight text-white mb-1">Acessar Conta</h3>
                <p className="text-xs text-slate-400 font-medium mb-6">Entre com seu e-mail e senha para acessar sua banca de forma segura.</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@email.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Senha</label>
                      <button 
                        type="button" 
                        onClick={() => { clearMessages(); setMode('forgot'); }}
                        className="text-[10px] hover:underline text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha secreta"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-10 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-mono font-bold"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 mt-6"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    <span>{loading ? 'Acessando...' : 'Entrar na Conta'}</span>
                  </button>
                </form>

                {/* Social Login Divider */}
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <span className="relative px-3 bg-slate-900 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Ou acessar com</span>
                </div>

                {/* Google Sign-In options */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-900 font-black rounded-xl text-xs transition-all tracking-wide cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-white/5"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.053 14.97 0 12 0 7.354 0 3.338 2.673 1.34 6.577L5.266 9.765z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.455 12.273c0-.818-.073-1.603-.205-2.363H12v4.582h6.436a5.5 5.5 0 0 1-2.386 3.606v3.011h3.845c2.25-2.073 3.56-5.127 3.56-8.836z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.266 14.235c-.254-.764-.4-1.582-.4-2.435s.146-1.671.4-2.435L1.34 6.577C.486 8.253 0 10.073 0 12s.486 3.747 1.34 5.423l3.926-3.188z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.956-1.076 7.941-2.916l-3.845-3.01c-1.077.72-2.455 1.154-4.096 1.154-3.155 0-5.83-2.136-6.78-5.003L1.34 17.423C3.338 21.327 7.354 24 12 24z"
                      />
                    </svg>
                    <span>Entrar rápido com Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleLoginRedirect}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 disabled:opacity-50 text-slate-300 font-extrabold rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Entrar no Celular (Modo Redirecionamento)</span>
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Novo na plataforma?{' '}
                    <button 
                      onClick={() => { clearMessages(); setMode('register'); }}
                      className="text-indigo-400 hover:text-indigo-300 font-extrabold hover:underline"
                    >
                      Criar uma conta
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* REGISTER MODE */}
            {mode === 'register' && (
              <motion.div
                key="register-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <h3 className="text-lg font-black tracking-tight text-white mb-1">Nova Conta</h3>
                <p className="text-xs text-slate-400 font-medium mb-6">Cadastre-se para acompanhar sua banca de forma segura nas nuvens.</p>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@email.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-10 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha longa"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-10 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-mono font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 mt-6"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span>{loading ? 'Cadastrando...' : 'Registrar Minha Conta'}</span>
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Já tem cadastro?{' '}
                    <button 
                      onClick={() => { clearMessages(); setMode('login'); }}
                      className="text-indigo-400 hover:text-indigo-300 font-extrabold hover:underline"
                    >
                      Acesse sua Conta
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <button 
                    onClick={() => { clearMessages(); setMode('login'); }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-lg font-black tracking-tight text-white">Recuperar Senha</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-6">Nós lhe enviaremos um link seguro por e-mail para que você redefina instantaneamente sua senha.</p>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: nome@email.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-600 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-3 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 mt-6"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>{loading ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* EMAIL VERIFICATION INTERMEDIARY STEP */}
            {mode === 'verify' && (
              <motion.div
                key="verify-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
                  <Mail className="h-7 w-7 animate-bounce" />
                </div>

                <h3 className="text-xl font-black tracking-tight text-white mb-2">Confirme seu E-mail ✉️</h3>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed mb-1">
                  Enviamos um link de confirmação para sua conta:
                </p>
                <span className="inline-block bg-slate-950/80 px-3 py-1.5 rounded-xl text-amber-400 border border-slate-800 text-xs font-mono font-bold select-all mb-6">
                  {currentUser?.email || email}
                </span>

                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-left text-slate-400 text-xs space-y-2.5 font-semibold mb-6">
                  <div className="flex gap-2 items-start text-indigo-400">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-bold tracking-wide uppercase text-[10px]">O que fazer agora:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    <li>Dê uma olhada na sua caixa de entrada.</li>
                    <li>Verifique também sua pasta de <span className="text-amber-400">Spam</span> ou Lixo Eletrônico.</li>
                    <li>Clique no link no e-mail recebido.</li>
                    <li>Clique em **Confirmar Acesso** abaixo!</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCheckVerification}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>Confirmar Acesso (Já Verifiquei)</span>
                  </button>

                  <button
                    onClick={handleResendVerification}
                    disabled={loading || cooldown > 0}
                    className="w-full py-2.5 px-4 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar E-mail de Confirmação'}
                    </span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-transparent hover:bg-rose-500/10 text-rose-400 font-bold hover:text-rose-300 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Usar Outro E-mail / Sair</span>
                  </button>
                </div>

                <div className="mt-8 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-left flex gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    <span className="text-amber-400 font-bold block mb-0.5">Nota sobre o Firebase Console:</span>
                    Certifique-se de que o provedor de <strong className="text-white">"E-mail/Senha"</strong> (Email/Password) esteja habilitado em <strong className="text-white">Authentication &gt; Sign-in method</strong> no console do seu projeto Firebase.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </motion.div>

        {/* Footer info text */}
        <p className="text-center text-[10px] text-slate-500 font-medium mt-6">
          Desenvolvido com tecnologia de Nuvem e Banco de Dados Local Seguro.
        </p>

      </div>
    </div>
  );
}
