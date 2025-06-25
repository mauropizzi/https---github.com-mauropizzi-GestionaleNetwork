import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { servicePointsData } from "@/lib/centrale-data";

interface ServiziRichiesti {
  id: string;
  created_at: string;
  type: string;
  client_id: string;
  service_point_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number;
  num_agents?: number;
  cadence_hours?: number;
  inspection_type?: string;
  daily_hours_config?: any;
}

export const printSingleServiceReport = async (reportId: string) => {
  showInfo(`Generazione PDF per il rapporto ${reportId}...`);

  const { data: report, error } = await supabase
    .from('servizi_richiesti')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    showError(`Errore nel recupero del rapporto: ${error.message}`);
    console.error("Error fetching single service report:", error);
    return;
  }

  if (!report) {
    showError(`Rapporto con ID ${reportId} non trovato.`);
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Dettagli Rapporto Servizio", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`ID Rapporto: ${report.id}`, 14, y);
  y += 7;
  doc.text(`Data Creazione: ${format(new Date(report.created_at), "PPP HH:mm", { locale: it })}`, 14, y);
  y += 7;
  doc.text(`Tipo Servizio: ${report.type}`, 14, y);
  y += 7;
  doc.text(`ID Cliente: ${report.client_id || 'N/A'}`, 14, y);
  y += 7;

  const servicePointName = servicePointsData.find(sp => sp.code === report.service_point_id)?.name || report.service_point_id || 'N/A';
  doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
  y += 7;

  doc.text(`Periodo Servizio: dal ${format(new Date(report.start_date), "PPP", { locale: it })} ${report.start_time} al ${format(new Date(report.end_date), "PPP", { locale: it })} ${report.end_time}`, 14, y);
  y += 7;
  doc.text(`Stato: ${report.status}`, 14, y);
  y += 7;
  doc.text(`Agenti Richiesti: ${report.num_agents || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Costo Stimato: ${report.calculated_cost !== undefined && report.calculated_cost !== null ? `${report.calculated_cost.toFixed(2)} €` : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Cadenza Ore (Ispezioni): ${report.cadence_hours || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Tipo Ispezione: ${report.inspection_type || 'N/A'}`, 14, y);
  y += 7;

  // Add a section for daily_hours_config if it exists
  if (report.daily_hours_config && Array.isArray(report.daily_hours_config) && report.daily_hours_config.length > 0) {
    y += 10;
    doc.setFontSize(14);
    doc.text("Configurazione Orari Giornalieri:", 14, y);
    y += 7;
    doc.setFontSize(10);
    const dailyHoursTableData = report.daily_hours_config.map((dh: any) => [
      dh.day,
      dh.is24h ? "H24" : `${dh.startTime || 'N/A'} - ${dh.endTime || 'N/A'}`
    ]);
    (doc as any).autoTable({
      startY: y,
      head: [['Giorno', 'Orario']],
      body: dailyHoursTableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
    });
    y = (doc as any).autoTable.previous.finalY + 10;
  }

  doc.output('dataurlnewwindow');
  showSuccess(`PDF del rapporto ${reportId} generato con successo!`);
};