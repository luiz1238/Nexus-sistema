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
  const isProcessing = useRef(false);
  const queue = useRef<any[]>([]);
  const { on } = useRealtime();

  const [diceResult, setDiceResult] = useState<number | string | null>(null);
  const [diceDescription, setDiceDescription] = useState<string | null>(null);
  
  const lastDiceResult = useRef<number | string>(0);
  const lastDiceDescription = useRef<string>('');
  
  const diceResultRef = useRef<HTMLDivElement>(null);
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

    async function processRoll(rollVal: number | string, desc?: string) {
      isProcessing.current = true;

      // 1. Ativa a exibição no componente pai (mostra o container)
      props.onShowDice();

      // 2. Reinicia e reproduz o vídeo do zero imediatamente
      if (diceVideo.current) {
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(() => {});
      }

      // 3. Atualiza os estados e os refs de fallback para o texto nunca falhar
      lastDiceResult.current = rollVal;
      setDiceResult(rollVal);

      if (desc) {
        lastDiceDescription.current = desc;
        setDiceDescription(desc);
      } else {
        lastDiceDescription.current = '';
        setDiceDescription(null);
      }

      // 4. Mantém o dado visível durante o tempo da animação (2.2 segundos)
      await sleep(2200);

      // 5. Limpa os textos
      setDiceResult(null);
      setDiceDescription(null);

      // 6. Oculta o container no componente pai
      props.onHideDice();
      await sleep(500);

      // 7. Processa o próximo da fila se houver, ou liberta o estado
      const next = queue.current.shift();
      if (next) {
        processRoll(next.roll, next.description);
      } else {
        isProcessing.current = false;
      }
    }

    const handleResultPayload = (payload: any) => {
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

      if (isProcessing.current) {
        queue.current.push({ roll: rollVal, description: desc });
      } else {
        processRoll(rollVal, desc);
      }
    };

    const unsub1 = on('diceRoll', (payload) => {
      if (payload.playerId !== props.playerId) return;
      props.onShowDice();
      if (diceVideo.current) {
        diceVideo.current.currentTime = 0;
        diceVideo.current.play().catch(() => {});
      }
    });

    const unsub2 = on('diceResult', handleResultPayload);

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
