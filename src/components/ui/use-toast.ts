import * as React from "react"

type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
  open?: boolean; // Added for dismiss functionality
}

type ToastAction = {
  type: "ADD_TOAST";
  toast: Toast;
} | {
  type: "UPDATE_TOAST";
  toast: Partial<Toast>;
} | {
  type: "DISMISS_TOAST";
  toastId?: string;
} | {
  type: "REMOVE_TOAST";
  toastId?: string;
}

interface State {
  toasts: Toast[];
}

const TOAST_LIMIT = 1; // Or whatever limit is desired
const TIME_BEFORE_REMOVE = 1000; // 1 second after dismiss

const reducer = (state: State, action: ToastAction): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case "DISMISS_TOAST":
      const { toastId } = action
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

let memoryState: State = { toasts: [] }
let listeners: ((state: State) => void)[] = []

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type ToastOptions = Omit<Toast, "id"> & { id?: string };

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((listener) => listener !== setState)
    }
  }, [state])

  const toast = React.useCallback((props: ToastOptions) => {
    const id = props.id || Math.random().toString(36).substring(2, 9);
    const toast = { ...props, id };
    dispatch({ type: "ADD_TOAST", toast });
    return {
      id: toast.id,
      dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: toast.id }),
      update: (props: Partial<Toast>) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } }),
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: React.useCallback((toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }), []),
  };
}

export { useToast, reducer };