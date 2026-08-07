import { useEffect, useRef, useState } from 'react';
import Fade from 'react-bootstrap/Fade';
import Image from 'react-bootstrap/Image';
import useRealtime from '../../hooks/useRealtime';
import styles from '../../styles/modules/Portrait.module.scss';
import api from '../../utils/api';
import PortraitDraggableResizable from './PortraitDraggableResizable';
import type { LayoutData } from './PortraitDraggableResizable';

export type PortraitAttributeStatus = {
  value: boolean;
  attribute_status_id: number;
}[];

function isDataUrl(url: string) {
  return url.startsWith('data:');
}

function appendCacheBust(url: string): string {
  if (isDataUrl(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

function stripCacheBust(url: string): string {
  if (isDataUrl(url)) return url;
  return url.split('?')[0];
}

export default function PortraitAvatar(props: {
  attributeStatus: PortraitAttributeStatus;
  playerId: number;
  debug?: boolean;
  layout?: LayoutData | null;
}) {
  const [src, setSrc] = useState('#');
  const srcRef = useRef('#');
  const [showAvatar, setShowAvatar] = useState(false);
  const [attributeStatus, setAttributeStatus] = useState(props.attributeStatus);
  const previousStatusID = useRef(Number.MAX_SAFE_INTEGER);

  // Armazena a cor ativa do brilho
  const [highlightColor, setHighlightColor] = useState<string | null>(null);

  const { on } = useRealtime();

  useEffect(() => {
    const id = attributeStatus.find((stat) => stat.value)?.attribute_status_id || 0;
    previousStatusID.current = id;
    api
      .get(`/sheet/player/avatar/${id}`, { params: { playerID: props.playerId } })
      .then((res) => {
        const newSrc = appendCacheBust(res.data.link);
        srcRef.current = newSrc;
        setSrc(newSrc);
      })
      .catch(() => {
        srcRef.current = '/avatar404.png';
        setSrc('/avatar404.png');
      });
  }, []);

  useEffect(() => {
    const unsubStatus = on('playerAttributeStatusChange', (payload) => {
      if (payload.playerId !== props.playerId) return;
      const newStatus = [...attributeStatus];

      const index = newStatus.findIndex((stat) => stat.attribute_status_id === payload.attStatusId);
      if (index === -1) return;

      newStatus[index].value = payload.value;

      const newStatusID = newStatus.find((stat) => stat.value)?.attribute_status_id || 0;
      setAttributeStatus(newStatus);

      if (newStatusID !== previousStatusID.current) {
        previousStatusID.current = newStatusID;
        api
          .get(`/sheet/player/avatar/${newStatusID}`, {
            params: { playerID: props.playerId },
          })
          .then((res) => {
            if (res.data.link === stripCacheBust(srcRef.current)) return;
            setShowAvatar(false);
            const newSrc = appendCacheBust(res.data.link);
            srcRef.current = newSrc;
            setSrc(newSrc);
          })
          .catch(() => {
            srcRef.current = '/avatar404.png';
            setSrc('/avatar404.png');
          });
      }
    });

    // Escuta o comando do Mestre para destacar o personagem
    const unsubHighlight = on('portraitHighlight', (payload) => {
      if (payload.playerId === props.playerId) {
        let color = payload.color || '#ddaf0f';
        if (!color.startsWith('#')) {
          color = `#${color}`;
        }
        setHighlightColor(color);
      } else {
        setHighlightColor(null);
      }
    });

    return () => {
      unsubStatus?.();
      unsubHighlight?.();
    };
  }, [on, attributeStatus, props.playerId]);

  return (
    <PortraitDraggableResizable
      storageKey="avatar"
      label="Avatar"
      defaultPosition={{ x: 0, y: 0 }}
      defaultSize={{ width: 420, height: 600 }}
      layout={props.layout}
      debug={props.debug}
      zIndex={1}
      playerId={props.playerId}
    >
      <Fade in={showAvatar || !!props.debug}>
        <div style={{ width: '100%', height: '100%', background: props.debug ? 'rgba(80,40,120,0.2)' : 'transparent' }}>
          <Image
            src={src}
            alt="Avatar"
            onError={() => setSrc('/avatar404.png')}
            onLoad={() => setShowAvatar(true)}
            className={styles.avatar}
            style={{
              // Aplica o brilho contornando a foto do personagem na cor única da sua ficha
              filter: highlightColor
                ? `drop-shadow(0 0 15px ${highlightColor}) drop-shadow(0 0 35px ${highlightColor})`
                : undefined,
              transition: 'filter 0.4s ease-in-out',
            }}
          />
        </div>
      </Fade>
    </PortraitDraggableResizable>
  );
}
