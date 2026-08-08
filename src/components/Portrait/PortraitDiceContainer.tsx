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
  
  const diceVideo = useRef<HTMLVideoElement>(null);
  const diceResultRef = useRef<HTMLDivElement>(null);
  const diceDescriptionRef = useRef<HTMLDivElement>(null);

  // Fila simples e segura para gerenciar rolagens em sequência sem travamentos
  const queue = useRef<DiceResponse[]>([]);
  const isRunning = useRef(false);

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

  // Filtro: Permite apenas atributos, perícias e características (ignora dano e customizados)
  function shouldIgnoreRoll(payload: any): boolean {
    const resolverKey = String(payload.resolverKey || '').toLowerCase();
    const excludedKeywords = ['damage', 'dano', 'custom', 'personalizado', 'weapon', 'arma'];
    return excludedKeywords.some(keyword => resolverKey.includes(keyword));
  }

  async function runQueue() {
    if (isRunning.current) return;
    isRunning.current = true;

    while (queue.current.length > 0) {
      const current = queue.current.shift();
      if (!current) continue;

      // 1. Mostra o container imediatamente acionando o pai
      props.onShowDice();

      // 2. Reproduz o vídeo do dado com tratamento seguro
      if (diceVideo.current) {
        try {
          diceVideo.current.currentTime = 0;
          await diceVideo.current.play();
        } catch (err) {
          console.error("Erro ao reproduzir vídeo:", err);
        }
      }

      // 3. Define o resultado e a descrição
      setDiceResult(current.roll);
      if (current.resultType?.description) {
        setDiceDescription(current.resultType.description);
      } else {
        setDiceDescription(null);
      }

      // 4. Mantém o resultado visível por 2 segundos
      await sleep(2000);

      // 5. Limpa e oculta o container
      setDiceResult(null);
      setDiceDescription(null);
      props.onHideDice();

      // Pequena pausa antes da próxima rolagem da fila
      await sleep(300);
    }

    isRunning.current = false;
  }

  useEffect(() => {
    if (!props.showDiceRoll) return;

    const unsub = on('diceResult', (payload) => {
      if (payload.playerId !== props.playerId) return;
      if (shouldIgnoreRoll(payload)) return;

      const { results, dices } = payload;

      if (results && results.length === 1) {
        queue.current.push(results[0]);
      } else if (Array.isArray(dices) && results) {
        const sum = results.reduce((prev, cur) => prev + cur.roll, 0);
        queue.current.push({ roll: sum });
      } else if (results && results.length > 0) {
        results.forEach((r) => queue.current.push(r));
      }

      runQueue();
    });

    return () => {
      unsub?.();
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
