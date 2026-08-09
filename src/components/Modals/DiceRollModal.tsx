import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Fade from 'react-bootstrap/Fade';
import Spinner from 'react-bootstrap/Spinner';
import { clamp } from '../../utils';
import SheetModal from './SheetModal';
import { DiceRequest, DiceResolverKey, DiceResponse } from '../../utils/dice';
import api from '../../utils/api';
import { ErrorLogger } from '../../contexts';

export type DiceRoll = {
  dices: (Omit<DiceRequest, 'num'> & { num?: number }) | DiceRequest[] | null;
  resolverKey?: DiceResolverKey;
  onResult?: (result: DiceResponse[]) => void | DiceResponse[];
};

export type DiceRollModalProps = DiceRoll & {
  onHide: () => void;
  onRollAgain: () => void;
  npcId?: number;
  _key?: number;
};

export default function DiceRollModal(props: DiceRollModalProps) {
  const [dices, setDices] = useState(props.dices);
  const [num, setNum] = useState(1);
  const diceRef = useRef<DiceRollResult | null>(null);

  useEffect(() => {
    if (props.dices === null) {
      diceRef.current = null;
      setDices(null);
      return;
    }
    if (Array.isArray(props.dices))
      return roll({
        dices: props.dices,
        onResult: props.onResult,
        resolverKey: props.resolverKey,
      });
    else if (props.dices.num) {
      const dices = {
        ...props.dices,
        num: props.dices.num,
      };
      return roll({
        dices,
        onResult: props.onResult,
        resolverKey: props.resolverKey,
      });
    }
    setDices(props.dices);
  }, [props.dices]);

  function onNumChange(coeff: number) {
    setNum((n) => {
      return clamp(n + coeff, 1, 9);
    });
  }

  function onExited() {
    setNum(1);
  }

  function roll(dice?: DiceRollResult) {
    if (dice) {
      diceRef.current = dice;
      return;
    }
    if (dices === null || Array.isArray(dices)) return;

    const roll = {
      dices: { ...dices, num },
      onResult: props.onResult,
      resolverKey: props.resolverKey,
    };
    diceRef.current = roll;
    setDices(null);
  }

  const showResult = props.dices !== null && !dices;

  return (
    <>
      <SheetModal
        title='Rolagem de Dados'
        show={dices !== null}
        onHide={() => {
          setDices(null);
          props.onHide();
        }}
        onExited={onExited}
        applyButton={{
          name: 'Rolar',
          onApply: () => roll(),
        }}
        centered>
        <Container fluid className='text-center'>
          <Row className='mb-1 justify-content-center'>
            <Col>Número de Dados</Col>
          </Row>
          <Row className='justify-content-center'>
            <Col xs='auto'>
              <Button variant='secondary' onClick={() => onNumChange(-1)} size='sm'>
                -
              </Button>
            </Col>
            <Col
              xs='auto'
              className='align-self-center'
              style={{ width: '1rem', padding: 0 }}>
              {num}
            </Col>
            <Col xs='auto'>
              <Button variant='secondary' onClick={() => onNumChange(1)} size='sm'>
                +
              </Button>
            </Col>
          </Row>
        </Container>
      </SheetModal>
      <DiceRollResultModal
        dices={showResult ? diceRef.current?.dices ?? null : null}
        onResult={diceRef.current?.onResult}
        resolverKey={diceRef.current?.resolverKey}
        npcId={props.npcId}
        _key={props._key}
        onHide={() => {}}
        onCloseModal={() => props.onHide()}
      />
    </>
  );
}

type DiceRollResult = Omit<DiceRoll, 'dices'> & {
  dices: DiceRequest | DiceRequest[] | null;
};

type DiceRollResultModalProps = Omit<
  DiceRollModalProps,
  'dices' | 'onRollAgain'
> & {
  dices: DiceRequest | DiceRequest[] | null;
  onCloseModal?: () => void;
};

type DisplayDice = {
  roll: number | string;
  description?: number | string;
};

function DiceRollResultModal(props: DiceRollResultModalProps) {
  const [diceResults, setDiceResults] = useState<DiceResponse[]>([]);
  const [descriptionFade, setDescriptionFade] = useState(false);

  const logError = useContext(ErrorLogger);

  const descriptionDelayTimeout = useRef<NodeJS.Timeout | null>(null);
  const [rollKey, setRollKey] = useState(0);

  const result: DisplayDice | undefined = useMemo(() => {
    if (diceResults.length === 1)
      return {
        roll: diceResults[0].roll,
        description: diceResults[0].resultType?.description,
      };
    else if (diceResults.length > 1) {
      if (Array.isArray(props.dices)) {
        const dices = diceResults.map((d) => d.roll);
        const sum = dices.reduce((a, b) => a + b, 0);
        return {
          roll: sum,
          description: dices.join(' + '),
        };
      } else {
        type _Result = { description?: string; weight: number };
        let max: _Result = { weight: Number.MIN_SAFE_INTEGER };
        let min: _Result = { weight: Number.MAX_SAFE_INTEGER };

        for (const result of diceResults) {
          if (result.resultType) {
            if (result.resultType.successWeight > max.weight)
              max = {
                description: result.resultType.description,
                weight: result.resultType.successWeight,
              };

            if (result.resultType.successWeight < min.weight)
              min = {
                description: result.resultType.description,
                weight: result.resultType.successWeight,
              };
          }
        }

        const roll = diceResults.map((d) => d.roll).join(' | ');
        let description: string | undefined;

        if (min.description && max.description) {
          if (min.description === max.description) description = min.description;
          else description = `${min.description} - ${max.description}`;
        } else description = min.description || max.description;

        return { roll, description };
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diceResults]);

  useEffect(() => {
    if (props.dices === null) return;
    setDiceResults([]);
    setDescriptionFade(false);
    api
      .post('/dice', {
        dices: props.dices,
        resolverKey: props.resolverKey,
        npcId: props.npcId,
      })
      .then((res) => {
        let results: DiceResponse[] = res.data.results;
        if (props.onResult) {
          let newResults = props.onResult(results);
          if (newResults) results = newResults;
        }
        setDiceResults(results);
      })
      .catch(logError);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props._key, props.dices, rollKey]);

  useEffect(() => {
    if (result && (diceResults.length > 1 || diceResults[0].resultType))
      descriptionDelayTimeout.current = setTimeout(() => setDescriptionFade(true), 750);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diceResults]);

  function onHide() {
    if (descriptionDelayTimeout.current) {
      clearTimeout(descriptionDelayTimeout.current);
      descriptionDelayTimeout.current = null;
    }
    props.onHide();
    if (props.onCloseModal) props.onCloseModal();
  }

  function onExited() {
    setDiceResults([]);
    setDescriptionFade(false);
  }

  function onRollAgain() {
    if (descriptionDelayTimeout.current) {
      clearTimeout(descriptionDelayTimeout.current);
      descriptionDelayTimeout.current = null;
    }
    setDiceResults([]);
    setDescriptionFade(false);
    setRollKey((k) => k + 1);
  }

  return (
    <SheetModal
      show={props.dices != null}
      onExited={onExited}
      title='Resultado da Rolagem'
      onHide={onHide}
      closeButton={{ disabled: !result }}
      backdrop={!result ? 'static' : true}
      keyboard={!result ? false : true}
      centered
      applyButton={{
        name: 'Rolar Novamente',
        onApply: onRollAgain,
        disabled: !result,
      }}
      bodyStyle={{ minHeight: 120, display: 'flex', alignItems: 'center' }}>

      <Container fluid className='text-center'>
        {!result && (
          <Row>
            <Col>
              <Spinner animation='border' style={{ color: '#c4a7e7' }} />
            </Col>
          </Row>
        )}
        <Row>
          {result && (
            <Fade in appear>
              <Col
                className='h1 m-0'
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '4rem',
                  textShadow: '0 0 10px #8a2be2, 0 0 20px #8a2be2'
                }}
              >
                {result.roll}
              </Col>
            </Fade>
          )}
        </Row>
        <Row className="mt-2">
          {result && (
            <Fade in={descriptionFade}>
              <Col style={{ color: '#c4a7e7', fontSize: '1.2rem' }}>
                {result.description}
              </Col>
            </Fade>
          )}
        </Row>
      </Container>
    </SheetModal>
  );
}
