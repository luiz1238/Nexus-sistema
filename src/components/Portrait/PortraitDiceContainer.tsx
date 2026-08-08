import { useEffect, useRef, useState } from 'react';
import useRealtime from '../../hooks/useRealtime';
import styles from '../../styles/modules/Portrait.module.scss';
import { sleep } from '../../utils';
import type { DiceResponse } from '../../utils/dice';
import { getAttributeStyle } from '../../utils/style';
import PortraitDraggableResizable from './PortraitDraggableResizable';
import type { LayoutData } from './PortraitDraggableResizable';

export default function PortraitDiceContainer(props: {
  playerId: number;
  showDice: boolean;
  onShowDice: () => void;
  onHideDice: () => void;
  color: string;
  showDiceRoll: boolean;
  debug?: boolean;
  layout?: LayoutData | null;
}) {
  const diceQueue = useRef<DiceResponse[]>([]);
  const { on } = useRealtime();
  
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef(false); // Ref para evitar recriar os listeners do socket
  
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  
  const diceVideo = useRef<HTMLVideoElement | null>(null);
  const diceResultRef = useRef<HTMLDivElement | null>(null);
  const diceDescriptionRef = useRef<HTMLDivElement | null>(null);

  // Atualiza o ref sempre que o estado muda
  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  // Aplica as cores personalizadas do atributo
  useEffect(() => {
    const style = getAttributeStyle(props.color);
    if (diceResultRef.current) {
      diceResultRef.current.style.color = style.color;
      diceResultRef.current.style.textShadow = style.textShadow;
    }
    if (diceDescriptionRef.current) {
      diceDescriptionRef.current.style.color = style.color;
      diceDescriptionRef.current.style.textShadow = style.textShadow;
    }
  }, [props.color, diceResult, diceDescription]);

  // Filtro para ignorar dano e customizados, permitindo apenas atributos, perícias e características
  function shouldIgnoreRoll(payload: any): boolean {
    const resolverKey = String(payload.resolverKey || '').toLowerCase();
    
    // Termos de dano ou customizados que NÃO devem aparecer no Portrait
    const excludedKeywords = ['damage', 'dano', 'custom', 'personalizado', 'weapon', 'arma'];
    
    if (excludedKeywords.some(keyword => resolverKey.includes(keyword))) {
      return true; // Ignora
    }
    
    return false; // Permite (atributos, perícias e características)
  }

  async function triggerDiceAnimation(result: DiceResponse) {
    setIsRolling(true);
    props.onShowDice();

    if (diceVideo.current) {
      try {
        diceVideo.current.currentTime = 0;
        await diceVideo.current.play();
      } catch (err) {
        console.error("Erro ao reproduzir vídeo:", err);
      }
    }

    await sleep(600);
    setDiceResult(result.roll);

    if (result.resultType?.description) {
      setDiceDescription(result.resultType.description);
    }

    await sleep(2000);
    setDiceResult(null);
    setDiceDescription(null);
    setIsRolling(false);
    props.onHideDice();

    const next = diceQueue.current.shift();
    if (next) {
      triggerDiceAnimation(next);
    }
  }

  const handleNewResult = (result: DiceResponse) => {
    if (isRollingRef.current) {
      diceQueue.current.push(result);
    } else {
      triggerDiceAnimation(result);
    }
  };

  // Configuração dos sockets (executada apenas uma vez ao montar)
  useEffect(() => {
    const unsub1 = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
      if (shouldIgnoreRoll(payload)) return; // Ignora se for dano/custom

      if (!isRollingRef.current) {
        setIsRolling(true);
        props.onShowDice();
        if (diceVideo.current) {
          diceVideo.current.currentTime = 0;
          diceVideo.current.play().catch(() => {});
        }
      }
    });

    const unsub2 = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      if (shouldIgnoreRoll(payload)) return; // Ignora se for dano/custom

      const { results, dices } = payload;

      if (results.length === 1) {
        handleNewResult(results[0]);
      } else if (Array.isArray(dices)) {
        handleNewResult({
          roll: results.reduce((prev, cur) => prev + cur.roll, 0),
        });
      } else {
        const first = results.shift();
        if (!first) return;
        diceQueue.current.push(...results);
        handleNewResult(first);
      }
    });

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [props.playerId]); // Dependência limpa apenas no playerId

  const isDebugMode = !!props.debug;
  const showContent = isDebugMode || isAccessible(isRolling, diceResult);

  return (
    <PortraitDraggableResizable
      storageKey="dice"
      label="Dado"
      defaultPosition={{ x: 30, y: 500 }}
      defaultSize={{ width: 360, height: 150 }}
      defaultFontSize={64}
      layout={props.layout}
      debug={props.debug}
      zIndex={200}
      playerId={props.playerId}
    >
      <video
        muted
        playsInline
        preload="auto"
        className={`${isDebugMode ? styles.diceDebug : `${styles.dice} ${isRolling || isDebugMode ? 'show' : ''}`}`}
        ref={diceVideo}
        style={{ display: isRolling || isDebugMode ? 'block' : 'none' }}
      />

      {showContent && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <div
            ref={diceResultRef}
            className="h1 m-0"
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '4rem',
            }}
          >
            {isDebugMode ? '42' : (diceResult ?? '')}
          </div>
          {(diceDescription || isDebugMode) && (
            <div ref={diceDescriptionRef} style={{ color: '#c4a7e7', fontSize: '1.2rem' }}>
              {isDebugMode ? 'Crítico' : diceDescription}
            </div>
          )}
        </div>
      )}
    </PortraitDraggableResizable>
  );
}

function isAccessible(isRolling: boolean, diceResult: number | null) {
  return isRolling || diceResult !== null;
}
