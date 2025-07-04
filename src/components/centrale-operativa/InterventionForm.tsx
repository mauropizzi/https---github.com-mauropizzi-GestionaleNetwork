import React from 'react';
import { useInterventionForm } from '@/hooks/use-intervention-form';

// Import modular components
import { EventDetailsSection } from './EventDetailsSection';
import { InterventionTimesSection } from './InterventionTimesSection';
import { AccessDetailsSection } from './AccessDetailsSection';
import { PersonnelSection } from './PersonnelSection';
import { AnomaliesDelaySection } from './AnomaliesDelaySection';
import { OutcomeBarcodeSection } from './OutcomeBarcodeSection';
import { InterventionActionButtons } from './InterventionActionButtons';

interface InterventionFormProps {
  eventId?: string; // Optional ID for editing
  onSaveSuccess?: () => void; // Callback for successful save/update
  onCancel?: () => void; // Callback for cancel
  isPublicMode?: boolean;
}

export function InterventionForm({ eventId, onSaveSuccess, onCancel, isPublicMode = false }: InterventionFormProps) {
  const {
    formData,
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    loadingInitialData,
    isOperatorNetworkOpen,
    setIsOperatorNetworkOpen,
    isGpgInterventionOpen,
    setIsGpgInterventionOpen,
    isServicePointOpen,
    setIsServicePointOpen,
    isCoOperatorOpen,
    setIsCoOperatorOpen,
    handleInputChange,
    handleSelectChange,
    handleRadioChange,
    handleSetCurrentTime,
    handleStartGpsTracking,
    handleEndGpsTracking,
    handlePrintPdf,
    handleEmail,
    handleCloseEvent,
    handleRegisterEvent,
  } = useInterventionForm({ eventId, onSaveSuccess, isPublicMode });

  if (loadingInitialData) {
    return (
      <div className="text-center py-8">
        Caricamento dati evento...
      </div>
    );
  }

  return (
    <React.Fragment>
      <form onSubmit={handleCloseEvent} className="space-y-6">
        <EventDetailsSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleSetCurrentTime={handleSetCurrentTime}
          handleStartGpsTracking={handleStartGpsTracking}
          puntiServizioList={puntiServizioList}
          coOperatorsPersonnel={coOperatorsPersonnel}
          isServicePointOpen={isServicePointOpen}
          setIsServicePointOpen={setIsServicePointOpen}
          isCoOperatorOpen={isCoOperatorOpen}
          setIsCoOperatorOpen={setIsCoOperatorOpen}
        />

        <InterventionTimesSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleSetCurrentTime={handleSetCurrentTime}
          handleEndGpsTracking={handleEndGpsTracking}
        />

        <AccessDetailsSection
          formData={formData}
          handleRadioChange={handleRadioChange}
        />

        <PersonnelSection
          formData={formData}
          handleSelectChange={handleSelectChange}
          operatoriNetworkList={operatoriNetworkList}
          pattugliaPersonale={pattugliaPersonale}
          isOperatorNetworkOpen={isOperatorNetworkOpen}
          setIsOperatorNetworkOpen={setIsOperatorNetworkOpen}
          isGpgInterventionOpen={isGpgInterventionOpen}
          setIsGpgInterventionOpen={setIsGpgInterventionOpen}
        />

        <AnomaliesDelaySection
          formData={formData}
          handleRadioChange={handleRadioChange}
          handleInputChange={handleInputChange}
        />

        <OutcomeBarcodeSection
          formData={formData}
          handleSelectChange={handleSelectChange}
          handleInputChange={handleInputChange}
        />

        <InterventionActionButtons
          eventId={eventId}
          handleEmail={handleEmail}
          handlePrintPdf={handlePrintPdf}
          handleRegisterEvent={handleRegisterEvent}
          handleCloseEvent={handleCloseEvent}
          onCancel={onCancel}
          isPublicMode={isPublicMode}
        />
      </form>
    </React.Fragment>
  );
}