import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { fetchPersonale, fetchOperatoriNetwork } from '@/lib/data-fetching';
import { Personale, OperatoreNetwork } from '@/lib/anagrafiche-data';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function InterventionForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    servicePoint: '',
    requestType: '',
    coOperator: '',
    requestTime: '',
    startTime: '',
    endTime: '',
    fullAccess: undefined as 'si' | 'no' | undefined,
    vaultAccess: undefined as 'si' | 'no' | undefined,
    operatorClient: '', // This will store the ID of the selected operator
    gpgIntervention: '', // This will now be a personnel ID
    anomalies: undefined as 'si' | 'no' | undefined,
    anomalyDescription: '',
    delay: undefined as 'si' | 'no' | undefined,
    delayNotes: '',
    serviceOutcome: '',
    barcode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [operatoriNetworkList, setOperatoriNetworkList] = useState<OperatoreNetwork[]>([]);
  const [pattugliaPersonale, setPattugliaPersonale] = useState<Personale[]>([]);
  const [isOperatorNetworkOpen, setIsOperatorNetworkOpen] = useState(false); // State for combobox popover

  useEffect(() => {
    const loadPersonnelData = async () => {
      const fetchedOperatoriNetwork = await fetchOperatoriNetwork();
      setOperatoriNetworkList(fetchedOperatoriNetwork);

      const fetchedPattuglia = await fetchPersonale('Pattuglia');
      console.log("Fetched 'Pattuglia' personnel for G.P.G. Intervention:", fetchedPattuglia);
      setPattugliaPersonale(fetchedPattuglia);
    };
    loadPersonnelData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: 'si' | 'no') => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSetCurrentTime = (field: string) => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({ ...prev, [field]: formattedDateTime }));
  };

  const handleGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));
          showSuccess(`Posizione GPS acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS: ${error.message}`);
          console.error("Error getting GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const generateBarcodeImage = (text: string): string | null => {
    if (!text) return null;
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: "CODE128",
        displayValue: true,
        height: 50,
        width: 2,
        margin: 10,
      });
      return canvas.toDataURL("image/png");
    } catch (error: any) {
      showError(`Errore nella generazione del codice a barre: ${error.message}`);
      console.error("Barcode generation error:", error);
      return null;
    }
  };

  const generatePdfBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.text("Rapporto Intervento Centrale Operativa", 14, y);
      y += 10;

      doc.setFontSize(10);
      const servicePointName = servicePointsData.find(p => p.code === formData.servicePoint)?.name || formData.servicePoint || 'N/A';
      doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
      y += 7;
      doc.text(`Intervento da effettuarsi ENTRO: ${servicePointsData.find(p => p.code === formData.servicePoint)?.interventionTime || 'N/A'} minuti`, 14, y);
      y += 7;
      doc.text(`Tipologia Servizio Richiesto: ${formData.requestType}`, 14, y);
      y += 7;
      doc.text(`Operatore C.O. Security Service: ${formData.coOperator}`, 14, y);
      y += 7;
      doc.text(`Orario Richiesta C.O. Security Service: ${formData.requestTime ? format(new Date(formData.requestTime), 'dd/MM/yyyy HH:mm') : 'N/A'}`, 14, y);
      y += 7;
      if (formData.latitude !== undefined && formData.longitude !== undefined) {
        doc.text(`Posizione GPS: Lat ${formData.latitude.toFixed(6)}, Lon ${formData.longitude.toFixed(6)}`, 14, y);
        y += 7;
      }
      doc.text(`Orario Inizio Intervento: ${formData.startTime ? format(new Date(formData.startTime), 'dd/MM/yyyy HH:mm') : 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Orario Fine Intervento: ${formData.endTime ? format(new Date(formData.endTime), 'dd/MM/yyyy HH:mm') : 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Accesso Completo: ${formData.fullAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Accesso Caveau: ${formData.vaultAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      // Find the full name for the PDF
      const selectedOperatorNetworkForPdf = operatoriNetworkList.find(op => op.id === formData.operatorClient);
      doc.text(`Operatore Network: ${selectedOperatorNetworkForPdf ? `${selectedOperatorNetworkForPdf.nome} ${selectedOperatorNetworkForPdf.cognome || ''}` : 'N/A'}`, 14, y);
      y += 7;
      const gpgInterventionName = pattugliaPersonale.find(p => p.id === formData.gpgIntervention);
      doc.text(`G.P.G. Intervento: ${gpgInterventionName ? `${gpgInterventionName.nome} ${gpgInterventionName.cognome}` : 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Anomalie Riscontrate: ${formData.anomalies?.toUpperCase() || 'N/A'}`, 14, y);
      if (formData.anomalies === 'si' && formData.anomalyDescription) {
        y += 5;
        doc.setFontSize(9);
        const splitAnomalyDesc = doc.splitTextToSize(`Descrizione Anomalie: ${formData.anomalyDescription}`, 180);
        doc.text(splitAnomalyDesc, 18, y);
        y += (splitAnomalyDesc.length * 4);
        doc.setFontSize(10); // Reset font size
      }
      y += 7;
      doc.text(`Ritardo: ${formData.delay?.toUpperCase() || 'N/A'}`, 14, y);
      if (formData.delay === 'si' && formData.delayNotes) {
        y += 5;
        doc.setFontSize(9);
        const splitDelayNotes = doc.splitTextToSize(`Motivo Ritardo: ${formData.delayNotes}`, 180);
        doc.text(splitDelayNotes, 18, y);
        y += (splitDelayNotes.length * 4);
        doc.setFontSize(10); // Reset font size
      }
      y += 7;
      doc.text(`Esito Evento: ${formData.serviceOutcome || 'N/A'}`, 14, y);
      y += 7;

      if (formData.barcode) {
        const barcodeDataURL = generateBarcodeImage(formData.barcode);
        if (barcodeDataURL) {
          doc.text(`Barcode: ${formData.barcode}`, 14, y);
          y += 5;
          doc.addImage(barcodeDataURL, 'PNG', 14, y, 100, 20); // x, y, width, height
          y += 25; // Adjust y for image height
        } else {
          doc.text(`Barcode: ${formData.barcode} (Impossibile generare immagine)`, 14, y);
          y += 7;
        }
      } else {
        doc.text(`Barcode: N/A`, 14, y);
        y += 7;
      }

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  };

  const handlePrintPdf = async () => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generatePdfBlob();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  };

  const handleEmail = async () => {
    const servicePointName = servicePointsData.find(p => p.code === formData.servicePoint)?.name || formData.servicePoint || 'N/A';
    const subject = `Rapporto Intervento Centrale Operativa - ${servicePointName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    const textBody = "Si trasmettono in allegato i dettagli del servizio richiesto.\n\nBuon lavoro.";
    
    showInfo("Generazione PDF per l'allegato email...");
    const pdfBlob = await generatePdfBlob();

    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1]; // Get base64 part
        if (base64data) {
          sendEmail(subject, textBody, false, {
            filename: `Rapporto_Intervento_Centrale_Operativa_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`,
            content: base64data,
            contentType: 'application/pdf'
          });
        } else {
          showError("Errore nella conversione del PDF in Base64.");
        }
      };
      reader.onerror = () => {
        showError("Errore nella lettura del file PDF.");
      };
    } else {
      showError("Impossibile generare il PDF per l'allegato.");
    }
  };

  const saveIntervention = async (isFinal: boolean) => {
    const {
      servicePoint,
      requestType,
      coOperator,
      requestTime,
      startTime,
      endTime,
      fullAccess,
      vaultAccess,
      operatorClient, // This is now the ID
      gpgIntervention,
      anomalies,
      anomalyDescription,
      delay,
      delayNotes,
      serviceOutcome,
      barcode,
      latitude,
      longitude,
    } = formData;

    // Basic validation for both save types
    if (!servicePoint || !requestType || !requestTime) {
      showError("Punto Servizio, Tipologia Servizio Richiesto e Orario Richiesta sono obbligatori.");
      return;
    }

    // Additional validation for final submission
    if (isFinal) {
      if (!startTime || !endTime) {
        showError("Orario Inizio Intervento e Orario Fine Intervento sono obbligatori per la chiusura.");
        return;
      }
      if (fullAccess === undefined || vaultAccess === undefined || anomalies === undefined || delay === undefined) {
        showError("Tutti i campi 'SI/NO' sono obbligatori per la chiusura.");
        return;
      }
      if (!serviceOutcome) {
        showError("L'Esito Evento è obbligatorio per la chiusura.");
        return;
      }
    }

    const notesCombined = [];
    if (anomalies === 'si' && anomalyDescription) {
      notesCombined.push(`Anomalie: ${anomalyDescription}`);
    }
    if (delay === 'si' && delayNotes) {
      notesCombined.push(`Ritardo: ${delayNotes}`);
    }
    if (latitude !== undefined && longitude !== undefined) {
      notesCombined.push(`GPS: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
    }

    const payload = {
      report_date: format(new Date(requestTime), 'yyyy-MM-dd'),
      report_time: format(new Date(requestTime), 'HH:mm:ss'),
      service_point_code: servicePoint,
      request_type: requestType,
      co_operator: coOperator || null,
      operator_client: operatorClient || null, // This is now the ID
      gpg_intervention: gpgIntervention || null, // Now stores the ID of the selected personnel
      service_outcome: isFinal ? (serviceOutcome || null) : null,
      notes: notesCombined.length > 0 ? notesCombined.join('; ') : null,
      latitude: latitude || null,
      longitude: longitude || null,
    };

    const { data, error } = await supabase
      .from('allarme_interventi')
      .insert([payload]);

    if (error) {
      showError(`Errore durante la registrazione dell'evento: ${error.message}`);
      console.error("Error inserting alarm event:", error);
    } else {
      showSuccess(`Evento ${isFinal ? 'chiuso' : 'registrato'} con successo!`);
      console.log("Event saved successfully:", data);
      setFormData({ // Reset form
        servicePoint: '',
        requestType: '',
        coOperator: '',
        requestTime: '',
        startTime: '',
        endTime: '',
        fullAccess: undefined,
        vaultAccess: undefined,
        operatorClient: '',
        gpgIntervention: '',
        anomalies: undefined,
        anomalyDescription: '',
        delay: undefined,
        delayNotes: '',
        serviceOutcome: '',
        barcode: '',
        latitude: undefined,
        longitude: undefined,
      });
    }
  };

  const handleCloseEvent = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntervention(true); // Final save
  };

  const handleRegisterEvent = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntervention(false); // In-progress save
  };

  return (
    <form onSubmit={handleCloseEvent} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-point">Punto Servizio</Label>
        <Select 
          onValueChange={(value) => handleSelectChange('servicePoint', value)}
          value={formData.servicePoint}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona un punto servizio..." />
          </SelectTrigger>
          <SelectContent>
            {servicePointsData.map(point => (
              <SelectItem key={point.code} value={point.code}>
                {point.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Intervento da effettuarsi ENTRO:</Label>
        <div className="p-2 border rounded-md">
          {formData.servicePoint ? 
            servicePointsData.find(p => p.code === formData.servicePoint)?.interventionTime + " minuti" : 
            "N/A"}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-type">Tipologia Servizio Richiesto</Label>
        <Select
          onValueChange={(value) => handleSelectChange('requestType', value)}
          value={formData.requestType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona Tipologia Servizio..." />
          </SelectTrigger>
          <SelectContent>
            {requestTypeOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="co-operator">Operatore C.O. Security Service</Label>
        <Select
          onValueChange={(value) => handleSelectChange('coOperator', value)}
          value={formData.coOperator}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona operatore..." />
          </SelectTrigger>
          <SelectContent>
            {coOperatorOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-time">Orario Richiesta C.O. Security Service</Label>
        <div className="flex gap-2">
          <Input
            type="datetime-local"
            id="request-time"
            name="requestTime"
            value={formData.requestTime}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => handleSetCurrentTime('requestTime')}
          >
            Ora Attuale
          </Button>
        </div>
      </div>

      {/* GPS Acquisition Button and Display */}
      <div className="space-y-2">
        <Button 
          type="button" 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          onClick={handleGpsTracking}
        >
          ACQUISIZIONE POSIZIONE GPS
        </Button>
        {formData.latitude !== undefined && formData.longitude !== undefined && (
          <p className="text-sm text-gray-500 mt-1 text-center">
            Latitudine: {formData.latitude?.toFixed(6)}, Longitudine: {formData.longitude?.toFixed(6)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Orario Inizio Intervento</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleSetCurrentTime('startTime')}
            >
              Ora Attuale
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Orario Fine Intervento</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleSetCurrentTime('endTime')}
            >
              Ora Attuale
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Accesso Completo</Label>
        <RadioGroup
          value={formData.fullAccess}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('fullAccess', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="si" id="fullAccessSi" />
            <Label htmlFor="fullAccessSi">SI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="fullAccessNo" />
            <Label htmlFor="fullAccessNo">NO</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Accesso Caveau</Label>
        <RadioGroup
          value={formData.vaultAccess}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('vaultAccess', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="si" id="vaultAccessSi" />
            <Label htmlFor="vaultAccessSi">SI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="vaultAccessNo" />
            <Label htmlFor="vaultAccessNo">NO</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="operator-network">Operatore Network</Label>
        <Popover open={isOperatorNetworkOpen} onOpenChange={setIsOperatorNetworkOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOperatorNetworkOpen}
              className="w-full justify-between"
            >
              {formData.operatorClient
                ? operatoriNetworkList.find(op => op.id === formData.operatorClient)?.nome + " " + operatoriNetworkList.find(op => op.id === formData.operatorClient)?.cognome
                : "Seleziona operatore network..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Cerca operatore network..." />
              <CommandEmpty>Nessun operatore trovato.</CommandEmpty>
              <CommandGroup>
                {operatoriNetworkList.map((op) => (
                  <CommandItem
                    key={op.id}
                    value={`${op.nome} ${op.cognome || ''}`}
                    onSelect={() => {
                      setFormData(prev => ({ ...prev, operatorClient: op.id }));
                      setIsOperatorNetworkOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.operatorClient === op.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {op.nome} {op.cognome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gpg-intervention">G.P.G. Intervento</Label>
        <Select
          onValueChange={(value) => handleSelectChange('gpgIntervention', value)}
          value={formData.gpgIntervention}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona G.P.G. intervento..." />
          </SelectTrigger>
          <SelectContent>
            {pattugliaPersonale.map(personale => (
              <SelectItem key={personale.id} value={personale.id}>
                {personale.nome} {personale.cognome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Anomalie Riscontrate</Label>
        <RadioGroup
          value={formData.anomalies}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('anomalies', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="si" id="anomaliesSi" />
            <Label htmlFor="anomaliesSi">SI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="anomaliesNo" />
            <Label htmlFor="anomaliesNo">NO</Label>
          </div>
        </RadioGroup>
        {formData.anomalies === 'si' && (
          <Textarea
            id="anomalyDescription"
            name="anomalyDescription"
            placeholder="Descrivi le anomalie riscontrate..."
            value={formData.anomalyDescription}
            onChange={handleInputChange}
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Ritardo</Label>
        <RadioGroup
          value={formData.delay}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('delay', value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="si" id="delaySi" />
            <Label htmlFor="delaySi">SI</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="delayNo" />
            <Label htmlFor="delayNo">NO</Label>
          </div>
        </RadioGroup>
        {formData.delay === 'si' && (
          <Textarea
            id="delayNotes"
            name="delayNotes"
            placeholder="Motivo del ritardo..."
            value={formData.delayNotes}
            onChange={handleInputChange}
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-outcome">Esito Evento</Label>
        <Select
          onValueChange={(value) => handleSelectChange('serviceOutcome', value)}
          value={formData.serviceOutcome}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona esito..." />
          </SelectTrigger>
          <SelectContent>
            {serviceOutcomeOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode</Label>
        <Input
          type="text"
          id="barcode"
          name="barcode"
          placeholder="Inserisci barcode..."
          value={formData.barcode}
          onChange={handleInputChange}
        />
      </div>

      <div className="pt-4 flex gap-4">
        <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
          INVIA EMAIL
        </Button>
        <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
          STAMPA PDF
        </Button>
        <Button type="button" className="w-full bg-gray-500 hover:bg-gray-600" onClick={handleRegisterEvent}>
          REGISTRA EVENTO
        </Button>
        <Button type="submit" className="w-full">
          Chiudi Evento
        </Button>
      </div>
    </form>
  );
}