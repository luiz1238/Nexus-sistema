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
  const { on } = useRealtime();
  
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  
  // Substituímos isRolling por "fases" para podermos animar a saída!
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'exiting'>('idle');

  const diceVideo = useRef<HTMLVideoElement>(null);
  const diceResultRef = useRef<HTMLDivElement>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);

  const queue = useRef<DiceResponse[]>([]);
  const isProcessing = useRef(false);

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

  // Filtro: Exibe APENAS atributos, perícias e características
  function shouldIgnoreRoll(payload: any): boolean {
    const resolverKey = String(payload?.resolverKey || '').toLowerCase();
    const title = String(payload?.title || payload?.description || '').toLowerCase();
    const excluded = ['damage', 'dano', 'custom', 'personalizado', 'weapon', 'arma'];
    return excluded.some((keyword) => resolverKey.includes(keyword) || title.includes(keyword));
  }

  async function processQueue() {
    if (isProcessing.current) return;
    isProcessing.current = true;

    while (queue.current.length > 0) {
      const current = queue.current.shift();
      if (!current) continue;

      setPhase('rolling');
      props.onShowDice();

      if (diceVideo.current) {
        // 🚨 O SEGREDO DEFINITIVO: Separar o currentTime do play() em try..catch isolados!
        // Assim, se o OBS travar ao zerar o tempo, NÃO impede o vídeo de iniciar o play.
        try { diceVideo.current.currentTime = 0; } catch (err) { /* Ignora se estiver dormindo */ }
        try { diceVideo.current.play().catch(() => {}); } catch (err) { console.warn("Erro no play:", err); }
      }

      // Aguarda 450ms: momento exato do impacto do dado na tela
      await sleep(450);

      setDiceResult(current.roll);
      if (current.resultType?.description) {
        setDiceDescription(current.resultType.description);
      } else {
        setDiceDescription(null);
      }

      // Mantém o resultado visível na tela por 3 segundos
      await sleep(3000);

      // 🌪️ INICIA A ANIMAÇÃO DE SAÍDA GIRATÓRIA
      setPhase('exiting');
      
      // Aguarda o tempo exato da animação CSS encolher e sumir (500ms)
      await sleep(500);

      // Limpa os estados e esconde totalmente
      setDiceResult(null);
      setDiceDescription(null);
      setPhase('idle');
      props.onHideDice();

      // Um pequeno respiro antes do próximo dado na fila
      await sleep(200);
    }

    isProcessing.current = false;
  }

  function handleNewRoll(result: DiceResponse) {
    queue.current.push(result);
    processQueue();
  }

  useEffect(() => {
    const unsub = on('diceResult', (payload) => {
      if (Number(payload.playerId) !== Number(props.playerId)) return;
      if (shouldIgnoreRoll(payload)) return;

      const { results, dices } = payload;

      if (results && results.length === 1) {
        handleNewRoll(results[0]);
      } else if (Array.isArray(dices) && results) {
        const sum = results.reduce((prev, cur) => prev + cur.roll, 0);
        handleNewRoll({ roll: sum });
      } else if (results && results.length > 0) {
        results.forEach((r) => handleNewRoll(r));
      }
    });

    return () => {
      unsub?.();
    };
  }, [props.playerId]);

  const isDebugMode = !!props.debug;
  const isVisible = isDebugMode || phase === 'rolling' || phase === 'exiting';
  const isExiting = phase === 'exiting';

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
      <div className={styles.diceContainerInner}>
        {/* Div responsável pela animação de sumir (encolhe e gira) */}
        <div
          style={{
            width: '100%',
            height: '100%',
            opacity: isVisible && !isExiting ? 1 : 0,
            transform: isExiting ? 'scale(0) rotate(270deg)' : 'scale(1) rotate(0deg)',
            transition: isExiting
              ? 'transform 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.4s ease-in'
              : 'none',
            transformOrigin: 'center center',
          }}
        >
          <video
            src="/dice_animation.webm"
            muted
            playsInline
            preload="auto"
            className={`${isDebugMode ? styles.diceDebug : `popout${isVisible || props.showDice ? ' show' : ''} ${styles.dice}`}`}
            ref={diceVideo}
            style={{ display: 'block', pointerEvents: 'none' }}
          />
          {isVisible && (
            <div className={styles.diceTextGroup}>
              <div 
                className={styles.result} 
                ref={diceResultRef}
                style={{ fontSize: '8.5rem', fontWeight: 'bold' }} // O número se mantém bem grande!
              >
                {isDebugMode ? '42' : (diceResult ?? '')}
              </div>
              {diceDescription && (
                <div className={styles.description} ref={diceDescriptionRef}>
                  {isDebugMode ? 'Crítico' : diceDescription}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PortraitDraggableResizable>
  );
}
