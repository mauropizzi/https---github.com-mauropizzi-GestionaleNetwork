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
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CentraleOperativa = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    servicePoint: '',
    requestType: '',
    coOperator: '',
    requestTime: '',
    startTime: '',
    endTime: '',
    fullAccess: undefined as 'si' | 'no' | undefined, // Changed default to undefined
    vaultAccess: undefined as 'si' | 'no' | undefined, // Changed default to undefined
    operatorClient: '',
    gpgIntervention: '',
    anomalies: undefined as 'si' | 'no' | undefined, // Changed default to undefined
    anomalyDescription: '',
    delay: undefined as 'si' | 'no' | undefined, // Changed default to undefined
    delayNotes: '',
    serviceOutcome: '',
    barcode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

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
      doc.text(`Operatore Cliente: ${formData.operatorClient || 'N/A'}`, 14, y);
      y += 7;
      doc.text(`G.P.G. Intervento: ${formData.gpgIntervention || 'N/A'}`, 14, y);
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
      doc.text(`Esito Servizio: ${formData.serviceOutcome || 'N/A'}`, 14, y);
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

  const handlePrintPdf = async () => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generatePdfBlob();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF del rapporto di intervento generato con successo!");
    } else {
      showError("Impossibile generare il PDF per la stampa.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Manual validation for required radio groups
    if (formData.fullAccess === undefined) {
      showError("Seleziona 'SI' o 'NO' per 'Accesso Completo'.");
      return;
    }
    if (formData.vaultAccess === undefined) {
      showError("Seleziona 'SI' o 'NO' per 'Accesso Caveau'.");
      return;
    }
    if (formData.anomalies === undefined) {
      showError("Seleziona 'SI' o 'NO' per 'Anomalie Riscontrate'.");
      return;
    }
    if (formData.delay === undefined) {
      showError("Seleziona 'SI' o 'NO' per 'Ritardo'.");
      return;
    }

    toast({
      title: "Intervento registrato",
      description: "L'intervento è stato registrato con successo.",
    });
    console.log("Form data:", formData);
    // Here you would typically send the data to Supabase or another backend
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">REGISTRAZIONE INTERVENTI E ISPEZIONI</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="operator-client">Operatore Cliente</Label>
          <Select
            onValueChange={(value) => handleSelectChange('operatorClient', value)}
            value={formData.operatorClient}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona operatore cliente..." />
            </SelectTrigger>
            <SelectContent>
              {operatorClientOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {gpgInterventionOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
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
          <Label htmlFor="service-outcome">Esito Servizio</Label>
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
          <Button type="submit" className="w-full">
            Chiudi Evento
          </Button>
        </div>
      </form>

      {/* History section would go here */}
    </div>
  );
};

export default CentraleOperativa;