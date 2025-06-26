import { showSuccess, showError, showInfo } from "@/utils/toast"; // Aggiungi questo import

// ... (resto degli import esistenti)

const ServiceReportForm = () => {
  // ... (codice esistente)

  const handlePrintPdf = () => {
    try {
      const values = form.getValues();
      const doc = new jsPDF();
      
      // Intestazione
      doc.setFontSize(18);
      doc.text("RAPPORTO DOTAZIONI DI SERVIZIO", 105, 15, { align: 'center' });
      
      // Contenuto
      let y = 30;
      doc.setFontSize(12);
      
      // Sezione Dettagli
      doc.text(`• Data: ${format(values.serviceDate, 'dd/MM/yyyy', { locale: it })}`, 14, y);
      y += 7;
      doc.text(`• Addetto: ${values.employeeId}`, 14, y);
      y += 7;
      doc.text(`• Località: ${values.serviceLocation}`, 14, y);
      y += 10;

      // Sezione Veicolo
      doc.setFontSize(14);
      doc.text("VEICOLO", 14, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`- Modello: ${values.vehicleMakeModel}`, 20, y);
      y += 7;
      doc.text(`- Targa: ${values.vehiclePlate}`, 20, y);
      y += 7;
      doc.text(`- KM: ${values.startKm} → ${values.endKm}`, 20, y);
      y += 10;

      // Mostra il PDF
      doc.output('dataurlnewwindow');
      showSuccess("PDF generato correttamente!");
    } catch (error) {
      showError("Errore nella generazione del PDF");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* ... (sezioni esistenti del form) */}

        {/* Pulsanti finali - MODIFICATO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleEmail}
          >
            <Mail className="mr-2 h-4 w-4" /> Invia Email
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={handlePrintPdf}
          >
            <Printer className="mr-2 h-4 w-4" /> Stampa PDF
          </Button>
          
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" /> Salva
          </Button>
        </div>
      </form>
    </Form>
  );
};