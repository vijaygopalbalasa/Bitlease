// Global type declarations for BitLease frontend

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'w3m-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

// MetaMask provider types
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (args: { method: string; params?: any[] }) => Promise<any>;
    on?: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener?: (eventName: string, callback: (...args: any[]) => void) => void;
  };
}

// Custom error types
interface ContractError extends Error {
  code?: string | number;
  reason?: string;
  data?: any;
}

// Web3 types
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}