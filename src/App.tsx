import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, ArrowRight, LogOut, Github } from "lucide-react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Editor } from "./components/Editor";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // FUNCIÓN CORREGIDA: Ahora acepta el proveedor como parámetro
  const handleLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin 
      }
    });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsEditing(false);
  };

  // Si hay sesión y el usuario activó el editor, lo mostramos
  if (session && isEditing) {
    return (
      <Editor 
        userEmail={session.user.email || ""} 
        onBack={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-indigo-600">
          <FileText size={24} />
          FormatZero
        </div>

        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              {session.user.user_metadata.full_name || session.user.email}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleLogin('google')}
              className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Entrar con Google
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-8 mt-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-6 border border-indigo-100"
        >
          <Sparkles size={12} />
          <span>IA + NEUROCIENCIA DE APRENDIZAJE</span>
        </motion.div>

        <motion.h1 
          className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 mb-6 leading-[0.9]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Vomita tus notas. <br />
          <span className="text-indigo-600">Aprende rápido.</span>
        </motion.h1>

        <motion.p 
          className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {session 
            ? `Hola de nuevo. Tienes tus créditos listos para transformar esos audios y fotos en conocimiento real.`
            : "Sube fotos de tu libreta o audios de clase. Generamos guías de estudio diseñadas para que tu cerebro entienda todo a la primera."
          }
        </motion.p>

        {!session ? (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => handleLogin('google')}
              className="w-72 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Entrar con Google
            </button>
            <button
              onClick={() => handleLogin('github')}
              className="w-72 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <Github size={20} /> Entrar con GitHub
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xl flex items-center gap-3 mx-auto shadow-2xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          >
            EMPEZAR AHORA <ArrowRight size={24} />
          </button>
        )}

        <div className="mt-20 mx-auto max-w-4xl border border-slate-200 rounded-3xl shadow-2xl overflow-hidden bg-slate-50 relative group">
            <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
            </div>
            <div className="p-16 h-80 flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium italic">Sube tus apuntes y mira cómo sucede la magia...</p>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;