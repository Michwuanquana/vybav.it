"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeClient from "../../HomeClient";

interface SessionClientProps {
  dict: any;
  lang: string;
  sessionId: string;
}

export default function SessionClient({ dict, lang, sessionId }: SessionClientProps) {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/session/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // Session neexistuje, přesměrujeme na domovskou stránku
            router.push(`/${lang}`);
            return;
          }
          throw new Error("Failed to load session");
        }

        const data = await response.json();
        setSessionData(data);
      } catch (err: any) {
        console.error("Error loading session:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [sessionId, router, lang]);

  if (isLoading) {
    return (
      <div className="h-screen bg-sand flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-sage/20 border-t-sage rounded-full animate-spin mx-auto"></div>
          <p className="text-charcoal/60">Načítám session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-sand flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Chyba: {error}</p>
          <button 
            onClick={() => router.push(`/${lang}`)}
            className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage/90"
          >
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    );
  }

  return (
    <HomeClient 
      dict={dict} 
      lang={lang} 
      initialSessionId={sessionId}
      initialSessionData={sessionData}
    />
  );
}
