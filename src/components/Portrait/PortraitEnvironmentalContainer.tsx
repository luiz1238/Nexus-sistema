import { Fragment, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Fade from 'react-bootstrap/Fade';
import useRealtime from '../../hooks/useRealtime';
import styles from '../../styles/modules/Portrait.module.scss';
import type { Environment } from '../../utils/config';
import { getAttributeStyle } from '../../utils/style';
import type { PortraitEnvironmentOrientation } from '../Modals/GetPortraitModal';
import PortraitDraggableResizable from './PortraitDraggableResizable';
import type { LayoutData } from './PortraitDraggableResizable';

type PortraitPlayerName = { name: string; show: boolean };

type PortraitAttributes = {
  value: number;
  Attribute: {
    id: number;
    name: string;
    color: string;
  };
  maxValue: number;
  show: boolean;
}[];

export default function PortraitEnvironmentalContainer(props: {
  environment: Environment;
  attributes: PortraitAttributes;
  playerName: PortraitPlayerName;
  playerId: number;
  debug: boolean;
  nameOrientation: PortraitEnvironmentOrientation;
  attributesLayout?: LayoutData | null;
  nameLayout?: LayoutData | null;
}) {
  const [environment, setEnvironment] = useState(props.environment);
  const [diceColor, setDiceColor] = useState('000000');
  const { on } = useRealtime();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const color = params.get('dicecolor');
    if (color) {
      setDiceColor(color);
    }
  }, []);

  useEffect(() => {
    const unsub = on('environmentChange', (payload) => setEnvironment(payload.value as Environment));
    return () => { unsub?.(); };
  }, [on]);

  return (
    <>
      <PortraitAttributesContainer
        environment={environment}
        attributes={props.attributes}
        playerId={props.playerId}
        debug={props.debug}
        layout={props.attributesLayout}
      />
      <PortraitNameContainer
        environment={environment}
        playerName={props.playerName}
        playerId={props.playerId}
        debug={props.debug}
        diceColor={diceColor}
        nameOrientation={props.nameOrientation}
        layout={props.nameLayout}
      />
    </>
  );
}

function PortraitAttributesContainer(props: {
  environment: Environment;
  attributes: PortraitAttributes;
  playerId: number;
  debug: boolean;
  layout?: LayoutData | null;
}) {
  const [attributes, setAttributes] = useState(props.attributes);
  const { on } = useRealtime();

  useEffect(() => {
    const unsub = on('playerAttributeChange', (payload) => {
      if (payload.playerId !== props.playerId) return;

      setAttributes((attributes) => {
        const index = attributes.findIndex((attr) => attr.Attribute.id === payload.attributeId);
        if (index === -1) return attributes;

        const newAttributes = [...attributes];

        newAttributes[index].value = payload.value;
        newAttributes[index].maxValue = payload.maxValue;
        newAttributes[index].show = payload.show;

        return newAttributes;
      });
    });
    return () => { unsub?.(); };
  }, [on, props.playerId]);

  const show = props.debug || props.environment === 'combat';

  return (
    <PortraitDraggableResizable
      storageKey="attributes"
      label="Atributos"
      defaultPosition={{ x: 430, y: 200 }}
      defaultSize={{ width: 350, height: 250 }}
      defaultFontSize={48}
      layout={props.layout}
      debug={props.debug}
      zIndex={50}
      playerId={props.playerId}
    >
      <Fade in={show} mountOnEnter={false} unmountOnExit={false}>
        <div className={styles.combatInner} style={{ minHeight: show ? 'auto' : 0, opacity: show ? 1 : 0 }}>
          {attributes.map((attr) => (
            <Fragment key={attr.Attribute.id}>
              <span
                className={`${styles.attribute} atributo-primario ${attr.Attribute.name}`}
                style={getAttributeStyle(attr.Attribute.color)}>
                <label>{attr.show ? `${attr.value}/${attr.maxValue}` : '?/?'}</label>
              </span>
              <br />
            </Fragment>
          ))}
        </div>
      </Fade>
    </PortraitDraggableResizable>
  );
}

function PortraitNameContainer(props: {
  environment: Environment;
  playerName: PortraitPlayerName;
  playerId: number;
  debug: boolean;
  diceColor: string;
  nameOrientation: PortraitEnvironmentOrientation;
  layout?: LayoutData | null;
}) {
  const [playerName, setPlayerName] = useState(props.playerName);
  const { on } = useRealtime();

  useEffect(() => {
    const unsub1 = on('playerNameChange', (payload) => {
      if (payload.playerId !== props.playerId) return;
      setPlayerName((pn) => ({ ...pn, name: payload.value }));
    });

    const unsub2 = on('playerNameShowChange', (payload) => {
      if (payload.playerId !== props.playerId) return;
      setPlayerName((pn) => ({ ...pn, show: payload.show }));
    });
    return () => { unsub1?.(); unsub2?.(); };
  }, [on, props.playerId]);

  const show = props.debug || props.environment === 'idle';

  const alignStyle: CSSProperties = props.nameOrientation === 'Direita'
    ? { textAlign: 'end' }
    : { textAlign: 'start' };

  const formattedName = playerName.show
    ? (playerName.name || 'Desconhecido').replace(/ /g, '\n')
    : '???';

  return (
    <PortraitDraggableResizable
      storageKey="name"
      label="Nome"
      defaultPosition={{ x: 430, y: 480 }}
      defaultSize={{ width: 350, height: 120 }}
      defaultFontSize={48}
      layout={props.layout}
      debug={props.debug}
      zIndex={50}
      playerId={props.playerId}
    >
      <Fade in={show} mountOnEnter={false} unmountOnExit={false}>
        <div className={styles.nameContainerInner} style={{ ...alignStyle, opacity: show ? 1 : 0 }}>
          <label
            className={`${styles.name} nome`}
            style={{
              display: 'inline-block',
              transform: 'rotate(-8deg)',
              color: `#${props.diceColor}`,
              textShadow: `2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 0 0 10px #${props.diceColor}, 0 0 20px #${props.diceColor}`,
              textAlign: 'center',
              lineHeight: '1.1',
              whiteSpace: 'pre-line',
            }}
          >
            {formattedName}
          </label>
        </div>
      </Fade>
    </PortraitDraggableResizable>
  );
}
