import React from "react";
import { useForm } from "react-hook-form";
// ... (altri import esistenti)
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showSuccess, showInfo } from "@/utils/toast";

// ... (codice esistente fino alla funzione handleEmail)

const handlePrintPdf = () => {
  const values = form.getValues();
  const doc = new jsPDF();
  
  // Intestazione
  doc.setFontSize(18);
  doc.text("Rapporto Dotazioni di Servizio", 14, 15);
  
  // Dettagli Servizio
  doc.setFontSize(12);
  doc.text(`Data Servizio: ${format(values.serviceDate, "dd/MM/yyyy", { locale: it })}`, 14, 25);
  doc.text(`Addetto: ${values.employeeId}`, 14, 32);
  doc.text(`Località: ${values.serviceLocation}`, 14, 39);
  doc.text(`Tipo Servizio: ${values.serviceType}`, 14, 46);
  doc.text(`Orario: ${values.startTime} - ${values.endTime}`, 14, 53);

  // Dettagli Veicolo
  doc.setFontSize(14);
  doc.text("Dettagli Veicolo", 14, 65);
  doc.setFontSize(12);
  doc.text(`Marca/Modello: ${values.vehicleMakeModel}`, 14, 72);
  doc.text(`Targa: ${values.vehiclePlate}`, 14, 79);
  doc.text(`KM: ${values.startKm} - ${values.endKm}`, 14, 86);
  doc.text(`Stato Iniziale: ${values.vehicleInitialState}`, 14, 93);

  // Dotazioni (tabella)
  const dotazioniData = [
    ["GPS", values.gps === 'si' ? 'Presente' : 'Assente'],
    ["Radio Veicolare", values.radioVehicle === 'si' ? 'Presente' : 'Assente'],
    // ... altre dotazioni
  ];
  
  (doc as any).autoTable({
    startY: 100,
    head: [['Dotazione', 'Stato']],
    body: dotazioniData,
    theme: 'grid'
  });

  // Genera e apre il PDF
  doc.output('dataurlnewwindow');
  showSuccess("PDF generato con successo!");
};

// Modifica la sezione dei pulsanti finale:
<div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
  <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
    INVIA EMAIL
  </Button>
  <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
    STAMPA PDF
  </Button>
  <Button type="submit">
    REGISTRA RAPPORTO
  </Button>
</div>