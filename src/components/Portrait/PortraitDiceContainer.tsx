import { useEffect, useRef, useState } from 'react';
import Fade from 'react-bootstrap/Fade';
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
  const diceQueue = useRef<any[]>([]);
  const isAnimating = useRef(false);

  const { on } = useRealtime();

  const [diceResult, setDiceResult] = useState<number | string | null>(null);
  const diceResultRef = useRef<HTMLDivElement>(null);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);

  const diceVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!props.showDiceRoll) return;

    const style = getAttributeStyle(props.color);

    if (diceResultRef.current) {
      diceResultRef.current.style.color = style.color;
      diceResultRef.current.style.textShadow = style.textShadow;
    }

    if (diceDescriptionRef.current) {
      diceDescriptionRef.current.style.color = style.color;
      diceDescriptionRef.current.style.textShadow = style.textShadow;
    }

    async function triggerRollAnimation(rollValue: number | string, description?: string) {
      isAnimating.current = true;

      // 1. Mostra o container e dispara o vídeo do zero
      props.onShowDice();
      if (diceVideo.current) {
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(() => {});
      }

      // 2. Define o resultado imediatamente para aparecer junto com a animação
      setDiceResult(rollValue);
      setDiceDescription(description || null);

      // 3. Mantém visível por 2 segundos
      await sleep(2000);

      // 4. Esconde o resultado e o container
      setDiceResult(null);
      setDiceDescription(null);
      props.onHideDice();

      await sleep(300);

      // 5. Processa o próximo da fila se houver
      const next = diceQueue.current.shift();
      if (next) {
        triggerRollAnimation(next.roll, next.description);
      } else {
        isAnimating.current = false;
      }
    }

    const unsub1 = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
      props.onShowDice();
      if (diceVideo.current) {
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(() => {});
      }
    });

    const unsub2 = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      const { results, dices } = payload;

      if (!results || results.length === 0) return;

      let rollVal: number | string = '';
      let desc: string | undefined = undefined;

      if (results.length === 1) {
        rollVal = results[0].roll;
        desc = results[0].resultType?.description;
      } else if (Array.isArray(dices)) {
        rollVal = results.reduce((prev, cur) => prev + cur.roll, 0);
      } else {
        rollVal = results.map((d) => d.roll).join(' | ');
        desc = results.map((d) => d.resultType?.description).filter(Boolean).join(' - ');
      }

      if (isAnimating.current) {
        diceQueue.current.push({ roll: rollVal, description: desc });
        return;
      }

      triggerRollAnimation(rollVal, desc);
    });

    return () => { 
      unsub1?.(); 
      unsub2?.(); 
    };
  }, [props.showDiceRoll, props.playerId, props.color]);

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
          className={`${isDebugMode ? styles.diceDebug : `popout${props.showDice ? ' show' : ''} ${styles.dice}`}`}
          ref={diceVideo}
          preload="auto"
        >
          <source src='/dice_animation.webm' />
        </video>
        {(isDebugMode || diceResult !== null || diceDescription !== null) && (
          <div className={styles.diceTextGroup}>
            <div className={styles.result} ref={diceResultRef}>
              {isDebugMode ? '42' : (diceResult ?? '')}
            </div>
            <div className={styles.description} ref={diceDescriptionRef}>
              {isDebugMode ? 'Crítico' : (diceDescription ?? '')}
            </div>
          </div>
        )}
      </div>
    </PortraitDraggableResizable>
  );
}
