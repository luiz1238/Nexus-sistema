import React, { useEffect, useState, useRef } from 'react';
import styles from '@/styles/modules/Portrait.module.scss';
import io from 'socket.io-client';

interface DiceData {
  dice: string;
  result: number | string;
  rollerName?: string;
  resolverKey?: string;
  type?: string;
}

export default function PortraitDiceContainer({ characterID }: { characterID: string }) {
  const [currentRoll, setCurrentRoll] = useState<DiceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  
  const queueRef = useRef<DiceData[]>([]);
  const isProcessingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Filtro: SÓ exibe atributos, perícias e características (ignora dano e customizados)
  const shouldShowRoll = (data: any) => {
    const key = (data?.resolverKey || data?.type || '').toLowerCase();
    
    // Bloqueia explicitamente dano e personalizados
    if (
      key.includes('damage') || 
      key.includes('dano') || 
      key.includes('custom') || 
      key.includes('personalizado')
    ) {
      return false;
    }

    // Permite atributos, perícias e características
    const allowed = ['attribute', 'attr', 'skill', 'pericia', 'characteristic', 'caracteristica'];
    if (allowed.some(term => key.includes(term))) {
      return true;
    }

    // Se vier sem chave específica, por padrão permite rolagens normais da ficha
    return true;
  };

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (queueRef.current.length > 0) {
      const roll = queueRef.current.shift();
      if (!roll) continue;

      setCurrentRoll(roll);
      
      // Define o vídeo com base no dado (ex: d20 -> dice20.webm)
      const diceMatch = String(roll.dice || 'd20').match(/\d+/);
      const diceNumber = diceMatch ? diceMatch[0] : '20';
      setVideoSrc(`/dice${diceNumber}.webm`);
      
      setIsVisible(true);

      // Reprodução com garantia de timeout (fallback para evitar travamento no OBS)
      await new Promise<void>((resolve) => {
        const videoEl = videoRef.current;
        let timeoutId: NodeJS.Timeout;

        const cleanup = () => {
          if (videoEl) {
            videoEl.removeEventListener('ended', handleEnded);
            videoEl.removeEventListener('error', handleError);
          }
          clearTimeout(timeoutId);
        };

        const finish = () => {
          cleanup();
          resolve();
        };

        const handleEnded = () => finish();
        const handleError = () => finish();

        if (videoEl) {
          videoEl.currentTime = 0;
          videoEl.play().then(() => {
            videoEl.addEventListener('ended', handleEnded, { once: true });
            videoEl.addEventListener('error', handleError, { once: true });
            // Timeout de segurança caso o vídeo demore ou o evento ended falhe no OBS
            timeoutId = setTimeout(finish, 3500);
          }).catch(() => {
            // Se o autoplay for bloqueado ou falhar, aguarda via timer
            timeoutId = setTimeout(finish, 2000);
          });
        } else {
          timeoutId = setTimeout(finish, 2000);
        }
      });

      // Oculta brevemente antes da próxima animação da fila
      setIsVisible(false);
      await new Promise(r => setTimeout(r, 200));
    }

    isProcessingRef.current = false;
  };

  const enqueueRoll = (rollData: DiceData) => {
    if (!shouldShowRoll(rollData)) return;
    
    queueRef.current.push(rollData);
    processQueue();
  };

  useEffect(() => {
    const socket = io();

    socket.on(`diceRoll:${characterID}`, (data: DiceData) => {
      enqueueRoll(data);
    });

    socket.on('diceRoll', (data: any) => {
      if (data && (data.characterID === characterID || !data.characterID)) {
        enqueueRoll(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [characterID]);

  return (
    <div className={`${styles.diceContainer} ${isVisible ? styles.visible : styles.hidden}`}>
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          className={styles.diceVideo}
        />
      )}
      {isVisible && currentRoll && (
        <div className={styles.diceResultOverlay}>
          <span className={styles.diceNumberText}>{currentRoll.result}</span>
        </div>
      )}
    </div>
  );
}
