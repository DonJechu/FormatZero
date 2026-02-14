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

  // 1. CARGAR CRÉDITOS AL INICIAR
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
    // 2. VALIDACIÓN DE CRÉDITOS
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

      // 3. LLAMADA A EDGE FUNCTION (SEGURIDAD TOTAL)
      const { data, error: funcError } = await supabase.functions.invoke('process-notes', {
        body: { files: mediaParts, prompt: prompt }
      });

      if (funcError) throw new Error("Servidor ocupado. Intenta de nuevo.");

      const text = data.text;

      // 4. DESCONTAR CRÉDITO TRAS ÉXITO
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
      <header className="h-16 border-b bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-slate-800 leading-tight">FormatZero Mastery</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Créditos restantes: {credits !== null ? credits : "..."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {generatedContent && !isProcessing && (
            <PDFDownloadLink
              document={<MyDocument title={title} content={generatedContent} author={userEmail} />}
              fileName={`${title.replace(/\s+/g, '_')}.pdf`}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg"
            >
              {({ loading }) => (
                <>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  Descargar
                </>
              )}
            </PDFDownloadLink>
          )}

          <button 
            onClick={handleRealMagicGeneration}
            disabled={files.length === 0 || isProcessing || (credits !== null && credits <= 0)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:bg-slate-200 transition-all shadow-md"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isProcessing ? "Analizando..." : "PROCESAR MÁGICAMENTE"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-8 overflow-y-auto bg-white border-r">
          <div className="max-w-md mx-auto space-y-6">
            {/* ALERT DE COMPRA SI NO HAY CRÉDITOS */}
            {credits === 0 && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <Sparkles size={16} /> ¡Agotaste tus guías de regalo!
                </div>
                <p className="text-xs text-indigo-600">Sigue estudiando al máximo. Compra un paquete de 10 guías por solo $49 MXN.</p>
                <a 
                  href={`https://wa.me/7661033386?text=Hola! Quiero comprar créditos para mi cuenta: ${userEmail}`}
                  target="_blank"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
                >
                  <MessageCircle size={14} /> Comprar por WhatsApp
                </a>
              </div>
            )}

            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400'}`}>
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} />
              </div>
              <p className="text-slate-700 font-bold">Sube tus fuentes</p>
              <p className="text-slate-400 text-xs mt-1">Fotos o grabaciones de clase</p>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl flex gap-3 text-sm border border-red-100 animate-pulse"><AlertCircle size={18}/>{error}</div>}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Archivos ({files.length})</h4>
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {file.type.startsWith('audio/') ? <Music size={18} className="text-purple-500"/> : <FileText size={18} className="text-blue-500"/>}
                    <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                  </div>
                  <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-1"><X size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/2 bg-slate-900 relative">
          {isProcessing && (
            <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-12 text-center">
              <Loader2 className="animate-spin text-indigo-400 mb-6" size={64} />
              <h3 className="text-2xl font-black mb-3 italic tracking-tighter uppercase">Hackeando tu aprendizaje</h3>
              <p className="text-slate-400 max-w-xs text-sm leading-relaxed font-medium">Usando neurociencia para que no tengas que leer 20 veces lo mismo.</p>
            </div>
          )}

          {!generatedContent && !isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500">
              <Sparkles size={40} className="opacity-10 mb-4" />
              <p className="font-medium italic text-sm">La inteligencia aplicada aparecerá aquí</p>
            </div>
          )}

          <div className="h-full w-full p-10">
            <div className="bg-white rounded-2xl shadow-2xl h-full overflow-hidden border border-slate-700">
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