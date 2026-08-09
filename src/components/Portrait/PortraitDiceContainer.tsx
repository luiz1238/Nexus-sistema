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
  const [isRolling, setIsRolling] = useState(false);

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

  // Filtro: Exibe APENAS atributos, perícias e características (ignora dano e customizados)
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

      setIsRolling(true);
      props.onShowDice();

      if (diceVideo.current) {
        try {
          diceVideo.current.currentTime = 0;
          await diceVideo.current.play();
        } catch (err) {
          console.warn("OBS bloqueou o vídeo do dado, exibindo apenas o resultado:", err);
        }
      }

      // Aguarda 450ms: momento exato do impacto da animação
      await sleep(450);

      setDiceResult(current.roll);
      if (current.resultType?.description) {
        setDiceDescription(current.resultType.description);
      } else {
        setDiceDescription(null);
      }

      // Mantém o resultado visível por 3 segundos
      await sleep(3000);

      // Limpa os estados e oculta
      setDiceResult(null);
      setDiceDescription(null);
      setIsRolling(false);
      props.onHideDice();

      await sleep(300);
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
  const showContent = isDebugMode || isRolling || diceResult !== null;

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
        <video
          src="/dice_animation.webm"
          muted
          playsInline
          preload="auto"
          className={`${isDebugMode ? styles.diceDebug : `popout${isRolling || props.showDice ? ' show' : ''} ${styles.dice}`}`}
          ref={diceVideo}
          style={{ display: showContent ? 'block' : 'none' }}
        />
        {showContent && (
          <div className={styles.diceTextGroup}>
            <div 
              className={styles.result} 
              ref={diceResultRef}
              style={{ fontSize: '8.5rem', fontWeight: 'bold' }} // Tamanho do número aumentado aqui
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
    </PortraitDraggableResizable>
  );
}
