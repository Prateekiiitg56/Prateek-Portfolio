import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading from "../components/Loading";

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

export const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };

  useEffect(() => {
    // On mobile, the 3D scene never loads so setProgress is never called.
    // Drive the progress bar ourselves so the loading animation plays.
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.round(Math.random() * 12 + 5);
      if (pct >= 100) {
        pct = 100;
        setLoading(100);
        clearInterval(interval);
      } else {
        setLoading(pct);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => { }, [loading]);

  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {isLoading && <Loading percent={loading} />}
      <main className="main-body">{children}</main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
