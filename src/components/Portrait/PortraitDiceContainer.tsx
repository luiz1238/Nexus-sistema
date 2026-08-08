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
  const { on } = useRealtime();

  const [diceResult, setDiceResult] = useState<number | string | null>(null);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);

  const diceResultRef = useRef<HTMLDivElement>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);
  const diceVideo = useRef<HTMLVideoElement>(null);

  const queueRef = useRef<{ roll: number | string; description?: string }[]>([]);
  const isPlayingRef = useRef(false);

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

    // Força o pré-carregamento do vídeo para o motor do OBS (CEF)
    if (diceVideo.current) {
      diceVideo.current.load();
    }

    async function playRoll(rollVal: number | string, desc?: string) {
      isPlayingRef.current = true;

      props.onShowDice();

      if (diceVideo.current) {
        try {
          diceVideo.current.currentTime = 0;
          await diceVideo.current.play();
        } catch (e) {
          // Garante que se o OBS bloquear a promessa inicial, o fluxo continua
        }
      }

      setDiceResult(rollVal);
      setDiceDescription(desc || null);

      await sleep(2500);

      setDiceResult(null);
      setDiceDescription(null);
      props.onHideDice();

      await sleep(300);

      const next = queueRef.current.shift();
      if (next) {
        playRoll(next.roll, next.description);
      } else {
        isPlayingRef.current = false;
      }
    }

    const unsubResult = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      const { results, dices } = payload;
      if (!results || results.length === 0) return;

      let rollVal: number | string = '';
      let desc: string | undefined = undefined;

      if (results.length === 1) {
        rollVal = results[0].roll;
        desc = results[0].resultType?.description;
      } else if (Array.isArray(dices)) {
        rollVal = results.reduce((prev: number, cur: any) => prev + cur.roll, 0);
      } else {
        rollVal = results.map((d: any) => d.roll).join(' | ');
        desc = results.map((d: any) => d.resultType?.description).filter(Boolean).join(' - ');
      }

      if (isPlayingRef.current) {
        queueRef.current.push({ roll: rollVal, description: desc });
      } else {
        playRoll(rollVal, desc);
      }
    });

    const unsubRoll = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
      if (!isPlayingRef.current && diceVideo.current) {
        props.onShowDice();
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(() => {});
      }
    });

    return () => {
      unsubResult?.();
      unsubRoll?.();
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
          playsInline
          className={`${isDebugMode ? styles.diceDebug : `popout${props.showDice ? ' show' : ''} ${styles.dice}`}`}
          ref={diceVideo}
          preload="auto"
        >
          <source src='/dice_animation.webm' type="video/webm" />
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
