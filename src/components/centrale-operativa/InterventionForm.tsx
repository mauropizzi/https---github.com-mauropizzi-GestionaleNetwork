import React from 'react';
import { useInterventionForm } from '@/hooks/use-intervention-form';
import { FormProvider } from 'react-hook-form'; // Import FormProvider

// Import modular components
import { EventDetailsSection } from '../centrale-operativa/EventDetailsSection';
import { InterventionTimesSection } from '../centrale-operativa/InterventionTimesSection';
import { AccessDetailsSection } from '../centrale-operativa/AccessDetailsSection';
import { PersonnelSection } from '../centrale-operativa/PersonnelSection';
import { AnomaliesDelaySection } from '../centrale-operativa/AnomaliesDelaySection';
import { OutcomeBarcodeSection } from '../centrale-operativa/OutcomeBarcodeSection';
import { InterventionActionButtons } from '../centrale-operativa/InterventionActionButtons';

interface InterventionFormProps {
  eventId?: string; // Optional ID for editing
  onSaveSuccess?: () => void; // Callback for successful save/update
  onCancel?: () => void; // Callback for cancel
  isPublicMode?: boolean;
}

export function InterventionForm({ eventId, onSaveSuccess, onCancel, isPublicMode = false }: InterventionFormProps) {
  const {
    methods, // Get all methods from useForm
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
    <FormProvider {...methods}> {/* Wrap with FormProvider */}
      <form onSubmit={methods.handleSubmit(handleCloseEvent)} className="space-y-6">
        <EventDetailsSection
          puntiServizioList={puntiServizioList}
          coOperatorsPersonnel={coOperatorsPersonnel}
          isServicePointOpen={isServicePointOpen}
          setIsServicePointOpen={setIsServicePointOpen}
          isCoOperatorOpen={isCoOperatorOpen}
          setIsCoOperatorOpen={setIsCoOperatorOpen}
          handleSetCurrentTime={handleSetCurrentTime} // Still needed for specific time setting
          handleStartGpsTracking={handleStartGpsTracking} // Still needed for GPS
        />

        <InterventionTimesSection
          handleSetCurrentTime={handleSetCurrentTime}
          handleEndGpsTracking={handleEndGpsTracking}
        />

        <AccessDetailsSection /> {/* No props needed, uses formContext */}

        <PersonnelSection
          operatoriNetworkList={operatoriNetworkList}
          pattugliaPersonale={pattugliaPersonale}
          isOperatorNetworkOpen={isOperatorNetworkOpen}
          setIsOperatorNetworkOpen={setIsOperatorNetworkOpen}
          isGpgInterventionOpen={isGpgInterventionOpen}
          setIsGpgInterventionOpen={setIsGpgInterventionOpen}
        />

        <AnomaliesDelaySection /> {/* No props needed, uses formContext */}

        <OutcomeBarcodeSection /> {/* No props needed, uses formContext */}

        <InterventionActionButtons
          eventId={eventId}
          handleEmail={handleEmail}
          handlePrintPdf={handlePrintPdf}
          handleRegisterEvent={methods.handleSubmit(handleRegisterEvent)} {/* Pass handleSubmit wrapped function */}
          handleCloseEvent={methods.handleSubmit(handleCloseEvent)} {/* Pass handleSubmit wrapped function */}
          onCancel={onCancel}
          isPublicMode={isPublicMode}
        />
      </form>
    </FormProvider>
  );
}