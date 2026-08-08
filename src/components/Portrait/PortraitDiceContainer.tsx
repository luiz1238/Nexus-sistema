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
  const [isPlaying, setIsPlaying] = useState(false);

  const diceVideo = useRef<HTMLVideoElement>(null);
  const diceResultRef = useRef<HTMLDivElement>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);
  const lastDiceResult = useRef(0);
  const lastDiceDescription = useRef('');

  // Fila para gerenciar múltiplas rolagens em sequência sem travamentos
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

  async function processQueue() {
    if (isProcessing.current) return;
    isProcessing.current = true;

    while (queue.current.length > 0) {
      const result = queue.current.shift();
      if (!result) continue;

      setIsPlaying(true);
      props.onShowDice();

      if (diceVideo.current) {
        try {
          diceVideo.current.currentTime = 0;
          await diceVideo.current.play();
        } catch (e) {
          // Evita crash caso o navegador interrompa a reprodução
        }
      }

      await sleep(750);
      
      lastDiceResult.current = result.roll;
      setDiceResult(result.roll);

      if (result.resultType) {
        lastDiceDescription.current = result.resultType.description;
        setDiceDescription(result.resultType.description);
      } else {
        setDiceDescription(null);
      }

      await sleep(1500);

      setDiceResult(null);
      setDiceDescription(null);

      await sleep(250);
      props.onHideDice();
      setIsPlaying(false);
      await sleep(200);
    }

    isProcessing.current = false;
  }

  function handleRoll(result: DiceResponse) {
    queue.current.push(result);
    processQueue();
  }

  useEffect(() => {
    if (!props.showDiceRoll) return;

    const unsub1 = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
    });

    const unsub2 = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      const { results, dices } = payload;

      if (results.length === 1) {
        handleRoll(results[0]);
      } else if (Array.isArray(dices)) {
        handleRoll({
          roll: results.reduce((prev, cur) => prev + cur.roll, 0),
        });
      } else if (results.length > 0) {
        results.forEach(r => handleRoll(r));
      }
    });

    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [props.showDiceRoll, props.playerId]);

  const isDebugMode = !!props.debug;

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
          muted
          playsInline
          className={`${isDebugMode ? styles.diceDebug : `popout${props.showDice || isPlaying ? ' show' : ''} ${styles.dice}`}`}
          ref={diceVideo}
          preload="auto"
        >
          <source src='/dice_animation.webm' />
        </video>
        {(isDebugMode || diceResult !== null || diceDescription !== null) && (
          <div className={styles.diceTextGroup}>
            <div className={styles.result} ref={diceResultRef}>
              {isDebugMode ? '42' : (diceResult || lastDiceResult.current || '')}
            </div>
            <div className={styles.description} ref={diceDescriptionRef}>
              {isDebugMode ? 'Crítico' : (diceDescription || lastDiceDescription.current || '')}
            </div>
          </div>
        )}
      </div>
    </PortraitDraggableResizable>
  );
}
