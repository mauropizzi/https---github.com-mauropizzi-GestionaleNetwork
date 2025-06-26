const handlePrintPdf = () => {
  const values = form.getValues();
  
  // Create new PDF document
  const doc = new jsPDF();
  let y = 20; // Initial y position

  // Add title
  doc.setFontSize(18);
  doc.text("Rapporto Dotazioni di Servizio", 14, y);
  y += 10;

  // Add general info
  doc.setFontSize(10);
  doc.text(`Data Servizio: ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}`, 14, y);
  y += 7;
  doc.text(`Nominativo Dipendente: ${values.name}`, 14, y);
  y += 7;
  doc.text(`Provincia SEGMENTO: ${values.serviceLocation}`, 14, y);
  y += 7;
  doc.text(`Tipologia di Servizio: ${values.serviceType === "G.P.G." ? "Guardia Particolare Giurata" : "Addetto Servizi Fiduciari"}`, 14, y);
  y += 7;
  doc.text(`Inizio Servizio: ${values.startTime}`, 14, y);
  y += 7;
  doc.text(`Fine Servizio: ${values.endTime}`, 14, y);
  y += 10;

  // Vehicle section
  doc.setFontSize(12);
  doc.text("Dettagli Veicolo:", 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Marca/Modello Veicolo: ${values.vehicleMakeModel}`, 14, y);
  y += 7;
  doc.text(`Targa: ${values.vehiclePlate}`, 14, y);
  y += 7;
  doc.text(`KM Inizio Servizio: ${values.startKm}`, 14, y);
  y += 7;
  doc.text(`KM Fine Servizio: ${values.endKm}`, 14, y);
  y += 7;
  doc.text(`Stato del Veicolo ad Avvio Servizio: ${values.vehicleInitialState}`, 14, y);
  y += 7;
  doc.text(`Eventuali Danni: ${values.bodyworkDamage || 'Nessuno'}`, 14, y);
  y += 7;
  doc.text(`Dettaglio Anomalie Automezzo: ${values.vehicleAnomalies || 'Nessuna'}`, 14, y);
  y += 10;

  // Accessories section
  doc.setFontSize(12);
  doc.text("Controllo Accessori:", 14, y);
  y += 7;
  
  const accessories = [
    { name: "GPS", value: values.gps },
    { name: "Apparato Radio Veicolare", value: values.radioVehicle },
    { name: "Faro Brandeggiante", value: values.swivelingLamp },
    { name: "Apparato Radio Portatile", value: values.radioPortable },
    { name: "Torcia Portatile", value: values.flashlight },
    { name: "Estintore", value: values.extinguisher },
    { name: "Ruota di Scorta", value: values.spareTire },
    { name: "Gilet Alta Visibilità", value: values.highVisibilityVest }
  ];

  accessories.forEach(accessory => {
    doc.text(`${accessory.name}: ${accessory.value}`, 14, y);
    y += 7;
  });

  // Add GPS positions if available
  if (values.startLatitude && values.startLongitude) {
    y += 5;
    doc.text(`Posizione GPS Inizio Servizio: Lat ${values.startLatitude.toFixed(6)}, Lon ${values.startLongitude.toFixed(6)}`, 14, y);
    y += 7;
  }

  if (values.endLatitude && values.endLongitude) {
    doc.text(`Posizione GPS Fine Servizio: Lat ${values.endLatitude.toFixed(6)}, Lon ${values.endLongitude.toFixed(6)}`, 14, y);
    y += 7;
  }

  // Add timestamp and footer
  y += 10;
  doc.setFontSize(8);
  doc.text(`Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, y);
  doc.text("Security App - Sistema di Gestione Servizi", 14, doc.internal.pageSize.height - 10);

  // Open PDF in new tab
  doc.output('dataurlnewwindow');
  showSuccess("PDF del rapporto di servizio generato con successo!");
};