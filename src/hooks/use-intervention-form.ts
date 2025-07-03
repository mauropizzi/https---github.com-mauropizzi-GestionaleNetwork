import { useState, useEffect, useCallback } from 'react';
import { useInterventionDataFetching } from './use-intervention-data-fetching';
import { useInterventionFormState } from './use-intervention-form-state';
import { useInterventionActions } from './use-intervention-actions';

interface UseInterventionFormProps {
  eventId?: string;
  onSaveSuccess?: () => void;
  isPublicMode?: boolean;
}

export const useInterventionForm = ({ eventId, onSaveSuccess, isPublicMode = false }: UseInterventionFormProps) => {
  const {
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    loadingInitialData,
    initialFormData,
  } = useInterventionDataFetching(eventId, isPublicMode);

  const {
    formData,
    setFormData, // Keep setFormData for direct manipulation if needed (e.g., initial load)
    handleInputChange,
    handleSelectChange,
    handleRadioChange,
    handleSetCurrentTime,
    handleStartGpsTracking,
    handleEndGpsTracking,
    resetForm,
  } = useInterventionFormState(initialFormData);

  // State for Popover open/close (these are UI-specific, can remain here or be moved to component)
  const [isOperatorNetworkOpen, setIsOperatorNetworkOpen] = useState(false);
  const [isGpgInterventionOpen, setIsGpgInterventionOpen] = useState(false);
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isCoOperatorOpen, setIsCoOperatorOpen] = useState(false);

  const {
    handlePrintPdf,
    handleEmail,
    handleCloseEvent,
    handleRegisterEvent,
  } = useInterventionActions({
    formData,
    puntiServizioList,
    coOperatorsPersonnel,
    operatoriNetworkList,
    pattugliaPersonale,
    eventId,
    isPublicMode,
    onSaveSuccess,
    resetForm,
  });

  return {
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
  };
};