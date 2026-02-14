import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 45, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 35, borderBottom: 1, borderBottomColor: '#E5E7EB', paddingBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', letterSpacing: -1 },
  author: { fontSize: 8, color: '#9CA3AF', marginTop: 6, textTransform: 'uppercase' },
  
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#4F46E5', marginTop: 25, marginBottom: 12, textTransform: 'uppercase' },
  
  contextBox: { backgroundColor: '#F0F9FF', padding: 12, borderRadius: 6, marginBottom: 15, borderLeft: 3, borderLeftColor: '#0EA5E9' },
  contextLabel: { fontSize: 8, fontWeight: 'bold', color: '#0369A1', marginBottom: 3, textTransform: 'uppercase' },
  
  analogiaRow: { marginBottom: 15, paddingLeft: 10, borderLeft: 2, borderLeftColor: '#E5E7EB' },
  analogiaText: { fontSize: 10, color: '#6366F1', fontStyle: 'italic' },

  questionBox: { backgroundColor: '#F5F3FF', padding: 12, borderRadius: 6, marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C7D2FE' },
  questionLabel: { fontSize: 8, fontWeight: 'bold', color: '#4338CA', marginBottom: 3, textTransform: 'uppercase' },

  normalText: { fontSize: 10.5, color: '#374151', lineHeight: 1.6, marginBottom: 12, textAlign: 'justify' },
  footer: { position: 'absolute', bottom: 30, left: 45, right: 45, fontSize: 8, color: '#D1D5DB', textAlign: 'center' }
});

export const MyDocument = ({ title, content, author }: any) => {
  const renderContent = () => {
    if (!content) return <Text style={styles.normalText}>Cargando conocimiento...</Text>;
    
    // LIMPIEZA MAESTRA: Borramos cualquier asterisco o símbolo de Markdown que la IA haya puesto por error
    const sanitizedContent = content.replace(/[*#_]/g, '');

    return sanitizedContent.split('\n').map((line: string, i: number) => {
      const t = line.trim();
      if (!t) return null;

      // Usamos toUpperCase() para que la detección no falle por mayúsculas/minúsculas
      const upperLine = t.toUpperCase();

      if (upperLine.startsWith('SECCIÓN:')) {
        return <Text key={i} style={styles.sectionTitle}>{t.split(':')[1]?.trim() || t}</Text>;
      }
      
      if (upperLine.startsWith('CONTEXTO:')) {
        return (
          <View key={i} style={styles.contextBox}>
            <Text style={styles.contextLabel}>¿Por qué importa esto?</Text>
            <Text style={{fontSize: 10, color: '#0C4A6E'}}>{t.split(':')[1]?.trim() || t}</Text>
          </View>
        );
      }

      if (upperLine.startsWith('ANALOGÍA:')) {
        return (
          <View key={i} style={styles.analogiaRow}>
            <Text style={styles.analogiaText}>💡 Analogía: {t.split(':')[1]?.trim() || t}</Text>
          </View>
        );
      }

      if (upperLine.startsWith('PREGUNTA:') || upperLine.startsWith('RETO:')) {
        return (
          <View key={i} style={styles.questionBox}>
            <Text style={styles.questionLabel}>Reto de Memoria Activa</Text>
            <Text style={{fontSize: 10, color: '#4338CA', fontWeight: 'bold'}}>{t.split(':')[1]?.trim() || t}</Text>
          </View>
        );
      }

      if (upperLine.startsWith('NOTA:')) {
        return <Text key={i} style={[styles.normalText, {fontWeight: 'bold', color: '#B45309'}]}>⚠️ {t.split(':')[1]?.trim() || t}</Text>;
      }

      // Filtro para ignorar introducciones de chatbot
      if (t.startsWith('¡') || t.toLowerCase().includes('analizado') || t.startsWith('(')) return null;

      return <Text key={i} style={styles.normalText}>{t}</Text>;
    });
  };

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.author}>Ruta de Aprendizaje • {author}</Text>
        </View>
        <View>{renderContent()}</View>
        <Text style={styles.footer} fixed>FormatZero — Neurociencia aplicada al estudio</Text>
      </Page>
    </Document>
  );
};