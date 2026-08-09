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
  const diceQueue = useRef<DiceResponse[]>([]);
  const diceData = useRef<DiceResponse>();

  const showDiceRef = useRef(props.showDice);
  const { on } = useRealtime();

  const [diceResult, setDiceResult] = useState<number | null>(null);
  const diceResultRef = useRef<HTMLDivElement>(null);
  const lastDiceResult = useRef(0);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);
  const lastDiceDescription = useRef('');

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

    function showDiceRoll() {
      if (showDiceRef.current) return;
      showDiceRef.current = true;
      if (diceVideo.current) {
        props.onShowDice();
        diceVideo.current.currentTime = 0;
        diceVideo.current.play();
      }
    }

    async function showNextResult(result: DiceResponse) {
      showDiceRoll();
      await sleep(750);
      diceData.current = undefined;
      onDiceResult(result);
    }

    async function onDiceResult(result: DiceResponse) {
      if (diceData.current) return diceQueue.current.push(result);
      if (!showDiceRef.current) return showNextResult(result);

      diceData.current = result;

      lastDiceResult.current = result.roll;
      setDiceResult(result.roll);

      if (result.resultType) {
        lastDiceDescription.current = result.resultType.description;
        await sleep(750);
        setDiceDescription(result.resultType.description);
      }
      await sleep(1500);

      setDiceResult(null);
      setDiceDescription(null);

      await sleep(250);
      props.onHideDice();
      await sleep(600);
      showDiceRef.current = false;

      const next = diceQueue.current.shift();
      if (next) showNextResult(next);
      else diceData.current = undefined;
    }

    const unsub1 = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
      showDiceRoll();
    });

    const unsub2 = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      const { results, dices } = payload;

      if (results.length === 1) return onDiceResult(results[0]);

      if (Array.isArray(dices)) {
        onDiceResult({
          roll: results.reduce((prev, cur) => prev + cur.roll, 0),
        });
      } else {
        if (diceData.current) return diceQueue.current.push(...results);
        const first = results.shift();
        if (!first) return;
        diceQueue.current.push(...results);
        onDiceResult(first);
      }
    });

    return () => { unsub1?.(); unsub2?.(); };
  }, [props.showDiceRoll]);

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
