import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { MyDocument } from "./MyDocument";
import { supabase } from "../lib/supabase"; 
import { ArrowLeft, Sparkles, UploadCloud, FileText, X, Loader2, AlertCircle, Music, Download, MessageCircle } from "lucide-react";

interface EditorProps {
  userEmail: string;
  onBack: () => void;
}

export function Editor({ userEmail, onBack }: EditorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("Mi Guía de Estudio");
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .single();
      
      if (!error && data) {
        setCredits(data.credits);
      }
    };
    fetchCredits();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('audio/')
    );
    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpeg', '.jpg', '.webp'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    }
  });

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleRealMagicGeneration = async () => {
    if (credits !== null && credits <= 0) {
      setError("Te has quedado sin créditos. Compra más para seguir generando guías.");
      return;
    }

    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setGeneratedContent("");

    try {
      const mediaParts = await Promise.all(files.map(fileToGenerativePart));

      const prompt = `
      ERES UN EXPERTO EN NEUROCIENCIA Y PEDAGOGÍA DE ALTO NIVEL.
      Analiza los archivos adjuntos (fotos y audio) para crear una "Ruta de Aprendizaje Profundo".
      TU OBJETIVO: No solo transcribas. Logra que el usuario ENTIENDA el tema en la primera lectura usando técnicas de aprendizaje acelerado.
      REGLAS DE CONTENIDO (BASADAS EN NEUROCIENCIA):
      1. CONTEXTO PRIMERO: Antes de dar un concepto, explica brevemente PARA QUÉ sirve.
      2. ANALOGÍAS: Crea una analogía con algo cotidiano.
      3. EXPLICACIÓN "FEYNMAN": Usa un lenguaje claro (12 años) sin perder rigor técnico.
      4. INTERROGACIÓN ACTIVA: Plantea preguntas que obliguen al cerebro a pensar.
      FORMATO: Línea 1 Título, SECCIÓN:, PUNTO:, ANALOGÍA:, NOTA:, PREGUNTA:.
      PROHIBIDO: Asteriscos (**), saludos o comentarios de chatbot.
      `;

      const { data, error: funcError } = await supabase.functions.invoke('process-notes', {
        body: { files: mediaParts, prompt: prompt }
      });

      if (funcError) throw new Error("Servidor ocupado. Intenta de nuevo.");

      const text = data.text;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: credits! - 1 })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (!updateError) setCredits(prev => prev! - 1);

      const lines = text.split('\n');
      setTitle(lines[0].trim() || "Guía de Aprendizaje");
      setGeneratedContent(lines.slice(1).join('\n').trim());

    } catch (err: any) {
      setError(err.message || "Error al procesar. Intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER: Ajustado para ser responsivo */}
      <header className="h-auto min-h-16 border-b bg-white px-4 py-2 md:px-6 flex flex-wrap items-center justify-between shrink-0 shadow-sm z-20 gap-2">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight text-sm md:text-base">FormatZero Mastery</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Créditos: {credits !== null ? credits : "..."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {generatedContent && !isProcessing && (
            <PDFDownloadLink
              document={<MyDocument title={title} content={generatedContent} author={userEmail} />}
              fileName={`${title.replace(/\s+/g, '_')}.pdf`}
              className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              {({ loading }) => (
                <>
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                </>
              )}
            </PDFDownloadLink>
          )}

          <button 
            onClick={handleRealMagicGeneration}
            disabled={files.length === 0 || isProcessing || (credits !== null && credits <= 0)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-md"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            <span className="hidden sm:inline">{isProcessing ? "Analizando..." : "PROCESAR MÁGICAMENTE"}</span>
            <span className="sm:hidden">{isProcessing ? "" : "MAGIA"}</span>
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: Cambia de dirección en móvil */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* PANEL IZQUIERDO: ARCHIVOS */}
        <div className="w-full lg:w-1/2 p-4 md:p-8 overflow-y-auto bg-white border-b lg:border-b-0 lg:border-r">
          <div className="max-w-md mx-auto space-y-6">
            {credits === 0 && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <Sparkles size={16} /> ¡Agotaste tus guías de regalo!
                </div>
                <p className="text-xs text-indigo-600">Sigue estudiando al máximo. Paquete de 10 guías por $49 MXN.</p>
                <a 
                  href={`https://wa.me/7661033386?text=Hola! Quiero comprar créditos para mi cuenta: ${userEmail}`}
                  target="_blank"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  <MessageCircle size={14} /> Comprar por WhatsApp
                </a>
              </div>
            )}

            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400'}`}>
              <input {...getInputProps()} />
              <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={24} className="md:size-8" />
              </div>
              <p className="text-slate-700 font-bold text-sm md:text-base">Sube tus fuentes</p>
              <p className="text-slate-400 text-[10px] md:text-xs mt-1">Fotos o grabaciones de clase</p>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl flex gap-3 text-sm border border-red-100 animate-pulse"><AlertCircle size={18}/>{error}</div>}

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Archivos ({files.length})</h4>
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.startsWith('audio/') ? <Music size={16} className="text-purple-500"/> : <FileText size={16} className="text-blue-500"/>}
                    <span className="text-xs md:text-sm font-medium text-slate-700 truncate">{file.name}</span>
                  </div>
                  <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-1"><X size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA PDF */}
        <div className="w-full lg:w-1/2 bg-slate-900 relative flex-1 min-h-[300px]">
          {isProcessing && (
            <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
              <Loader2 className="animate-spin text-indigo-400 mb-4" size={48} />
              <h3 className="text-lg md:text-2xl font-black mb-2 italic tracking-tighter uppercase">Hackeando tu aprendizaje</h3>
              <p className="text-slate-400 max-w-xs text-xs md:text-sm leading-relaxed font-medium">Neurociencia aplicada para tu examen.</p>
            </div>
          )}

          {!generatedContent && !isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Sparkles size={32} className="opacity-10 mb-2" />
              <p className="font-medium italic text-xs md:text-sm">La inteligencia aplicada aparecerá aquí</p>
            </div>
          )}

          <div className="h-full w-full p-4 md:p-10">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl h-full overflow-hidden border border-slate-700">
              {generatedContent && (
                <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                  <MyDocument title={title} content={generatedContent} author={userEmail} />
                </PDFViewer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}