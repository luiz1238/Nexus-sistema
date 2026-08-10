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
  const lastDiceResult = useRef(0);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  const lastDiceDescription = useRef('');

  const diceVideo = useRef<HTMLVideoElement>(null);

  // Aplica o estilo das cores diretamente, prevenindo que o texto fique invisível
  const attributeStyle = getAttributeStyle(props.color);

  useEffect(() => {
    if (!props.showDiceRoll) return;

    function showDiceRoll() {
      if (showDiceRef.current) return;
      showDiceRef.current = true;
      if (diceVideo.current) {
        props.onShowDice();
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(console.error);
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

      try {
        lastDiceResult.current = result.roll;
        lastDiceDescription.current = '';
        setDiceResult(result.roll);
        setDiceDescription(null);

        if (result.resultType) {
          await sleep(750);
          lastDiceDescription.current = result.resultType.description;
          setDiceDescription(result.resultType.description);
        } else {
          lastDiceDescription.current = '';
          setDiceDescription(null);
        }
        await sleep(1500);
      } finally {
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
        
        {/* Recriado a estrutura original usando os componentes Fade */}
        <div className={styles.diceTextGroup}>
          <Fade in={isDebugMode || diceResult !== null}>
            <div 
              className={styles.result} 
              style={{ 
                fontSize: '9.5rem', 
                fontWeight: 'bold', 
                color: attributeStyle.color, 
                textShadow: attributeStyle.textShadow 
              }}
            >
              {isDebugMode ? '42' : (diceResult !== null ? diceResult : lastDiceResult.current)}
            </div>
          </Fade>
          
          <Fade in={isDebugMode || diceDescription !== null}>
            <div 
              className={styles.description}
              style={{ 
                color: attributeStyle.color, 
                textShadow: attributeStyle.textShadow 
              }}
            >
              {isDebugMode ? 'Crítico' : (diceDescription !== null ? diceDescription : lastDiceDescription.current)}
            </div>
          </Fade>
        </div>
      </div>
    </PortraitDraggableResizable>
  );
}
