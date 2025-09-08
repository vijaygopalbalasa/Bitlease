import React, { createContext, useContext, useReducer, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  action?: { href: string; label?: string };
  actions?: { href: string; label?: string }[];
}

type State = Notification[];

type Action =
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: State = [];

const NotificationContext = createContext<{
  state: State;
  addNotification: (
    message: string,
    type?: NotificationType,
    action?: { href: string; label?: string },
    actions?: { href: string; label?: string }[],
  ) => void;
  removeNotification: (id: string) => void;
} | undefined>(undefined);

function notificationReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      // Use UUID when available; fallback to time + random
      const id = (globalThis as any)?.crypto?.randomUUID?.()
        ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return [...state, { ...action.payload, id }];
    case 'REMOVE_NOTIFICATION':
      return state.filter((notification) => notification.id !== action.payload);
    default:
      return state;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (
    message: string,
    type: NotificationType = 'info',
    action?: { href: string; label?: string },
    actions?: { href: string; label?: string }[],
  ) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message, type, action, actions } });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  return (
    <NotificationContext.Provider value={{ state, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { state, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {state.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const { id, message, type, action, actions } = notification;

  const bgColor = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  }[type];

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`${bgColor} border-l-4 p-4 rounded shadow-lg max-w-sm w-80 transition-opacity duration-300`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div className="text-sm flex-1 pr-2">
          <p>{message}</p>
          {action?.href && (
            <a
              className="underline text-blue-700 hover:text-blue-900 break-all mr-3"
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {action.label ?? 'View transaction'}
            </a>
          )}
          {actions?.length ? (
            <div className="mt-1 space-x-3">
              {actions.map((a, idx) => (
                <a
                  key={idx}
                  className="underline text-blue-700 hover:text-blue-900 break-all"
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a.label ?? 'Open link'}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="ml-4 text-xl font-semibold opacity-70 hover:opacity-100"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
