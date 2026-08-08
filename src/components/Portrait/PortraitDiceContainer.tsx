import { useEffect, useRef, useState } from 'react';
import useRealtime from '../../hooks/useRealtime';
import styles from '../../styles/modules/Portrait.module.scss';
import { sleep } from '../../utils';
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

  // Estado local para garantir que o OBS exiba o container imediatamente sem depender do pai
  const [isLocalVisible, setIsLocalVisible] = useState(false);
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

    // Força o carregamento prévio do vídeo no motor do OBS
    if (diceVideo.current) {
      diceVideo.current.load();
    }

    async function playRoll(rollVal: number | string, desc?: string) {
      isPlayingRef.current = true;

      // Ativa visibilidade local e avisa o pai
      setIsLocalVisible(true);
      props.onShowDice();

      // Reinicia e dispara o vídeo de forma segura para o OBS
      if (diceVideo.current) {
        try {
          diceVideo.current.currentTime = 0;
          await diceVideo.current.play();
        } catch (err) {
          // Fallback caso o navegador/OBS restrinja o autoplay sem interação prévia
        }
      }

      // Exibe o resultado imediatamente junto com a animação
      setDiceResult(rollVal);
      setDiceDescription(desc || null);

      // Mantém visível por 2.5 segundos
      await sleep(2500);

      // Limpa os dados e oculta
      setDiceResult(null);
      setDiceDescription(null);
      setIsLocalVisible(false);
      props.onHideDice();

      await sleep(300);

      // Processa o próximo da fila se houver rolagens acumuladas
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
      if (!isPlayingRef.current) {
        setIsLocalVisible(true);
        props.onShowDice();
        if (diceVideo.current) {
          diceVideo.current.currentTime = 0;
          diceVideo.current.play().catch(() => {});
        }
      }
    });

    return () => {
      unsubResult?.();
      unsubRoll?.();
    };
  }, [props.showDiceRoll, props.playerId, props.color]);

  const isDebugMode = !!props.debug;
  // Usa o estado local ou a prop do pai para garantir que a classe 'show' dispare no OBS
  const shouldShow = isDebugMode || isLocalVisible || props.showDice;

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
          className={`${isDebugMode ? styles.diceDebug : `popout${shouldShow ? ' show' : ''} ${styles.dice}`}`}
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
