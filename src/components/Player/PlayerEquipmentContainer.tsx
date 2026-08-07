import type { Equipment } from '@prisma/client';
import { useContext, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import { ErrorLogger } from '../../contexts';
import useRealtime from '../../hooks/useRealtime';
import api from '../../utils/api';
import BottomTextInput from '../BottomTextInput';
import CustomSpinner from '../CustomSpinner';
import DataContainer from '../DataContainer';
import AddDataModal from '../Modals/AddDataModal';
import { resolveDices } from '../../utils/dice';
import type { DiceRollEvent } from '../../hooks/useDiceRoll';
import DiceRollModal from '../Modals/DiceRollModal';
import useDiceRoll from '../../hooks/useDiceRoll';
import EquipmentEditorModal, { EquipmentWithDefect } from '../Modals/EquipmentEditorModal';

type PlayerEquipmentContainerProps = {
  title: string;
  playerEquipments: EquipmentWithDefect[];
  availableEquipments: EquipmentWithDefect[];
  npcId?: number;
};

export default function PlayerEquipmentContainer(props: PlayerEquipmentContainerProps) {
  const [addEquipmentShow, setAddEquipmentShow] = useState(false);
  const [availableEquipments, setAvailableEquipments] = useState<{ id: number; name: string }[]>(
    props.availableEquipments
  );
  const [playerEquipments, setPlayerEquipments] = useState<EquipmentWithDefect[]>(
    props.playerEquipments
  );
  const [loading, setLoading] = useState(false);

  const [equipmentEditorModalShow, setEquipmentEditorModalShow] = useState(false);
  const [equipmentEditorData, setEquipmentEditorData] = useState<EquipmentWithDefect | undefined>(undefined);
  const [equipmentEditorOperation, setEquipmentEditorOperation] = useState<'create' | 'edit'>('create');

  const logError = useContext(ErrorLogger);
  const { on } = useRealtime();
  const [diceRoll, rollDice] = useDiceRoll(props.npcId);

  const socket_equipmentAdd = useRef<(id: number, name: string) => void>(() => {});
  const socket_equipmentRemove = useRef<(id: number) => void>(() => {});
  const socket_equipmentChange = useRef<(eq: EquipmentWithDefect) => void>(() => {});

  useEffect(() => {
    socket_equipmentAdd.current = (id, name) => {
      if (availableEquipments.findIndex((eq) => eq.id === id) > -1) return;
      setAvailableEquipments((equipments) => [...equipments, { id, name }]);
    };

    socket_equipmentRemove.current = (id) => {
      const index = playerEquipments.findIndex((equipment) => equipment.id === id);
      if (index === -1) return;
      setPlayerEquipments((equipment) => {
        const newEquipments = [...equipment];
        newEquipments.splice(index, 1);
        return newEquipments;
      });
    };

    socket_equipmentChange.current = (eq) => {
      const availableIndex = availableEquipments.findIndex((_eq) => _eq.id === eq.id);
      const playerIndex = playerEquipments.findIndex((_eq) => _eq.id === eq.id);

      if (eq.visible) {
        if (availableIndex === -1 && playerIndex === -1)
          return setAvailableEquipments((equipments) => [...equipments, eq]);
      } else if (availableIndex > -1) {
        return setAvailableEquipments((equipments) => {
          const newEquipments = [...equipments];
          newEquipments.splice(availableIndex, 1);
          return newEquipments;
        });
      }

      if (availableIndex > -1) {
        setAvailableEquipments((equipments) => {
          const newEquipments = [...equipments];
          newEquipments[availableIndex] = eq;
          return newEquipments;
        });
        return;
      }

      if (playerIndex === -1) return;

      setPlayerEquipments((equipments) => {
        const newEquipments = [...equipments];
        newEquipments[playerIndex] = eq;
        return newEquipments;
      });
    };
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    unsubs.push(on('equipmentAdd', (payload) => socket_equipmentAdd.current(payload.id, payload.name)));
    unsubs.push(on('equipmentRemove', (payload) => socket_equipmentRemove.current(payload.id)));
    unsubs.push(on('equipmentChange', (payload) => socket_equipmentChange.current(payload.equipment)));
    return () => { unsubs.forEach((u) => u()); };
  }, [on]);

  function onEquipmentCreateSubmit(equipment: EquipmentWithDefect) {
    setLoading(true);
    api
      .put('/sheet/equipment', equipment)
      .then((res) => {
        return api.put('/sheet/player/equipment', { id: res.data.id, npcId: props.npcId });
      })
      .then((res) => {
        const newEquipment = res.data.equipment as EquipmentWithDefect;
        setPlayerEquipments([...playerEquipments, { ...newEquipment, defeito: equipment.defeito }]);
        setEquipmentEditorModalShow(false);
      })
      .catch(logError)
      .finally(() => setLoading(false));
  }

  function onEquipmentEditSubmit(equipment: EquipmentWithDefect) {
    setLoading(true);
    api
      .post('/sheet/equipment', equipment)
      .catch(logError)
      .finally(() => {
        setLoading(false);
        setEquipmentEditorModalShow(false);
      });
  }

  function onAddEquipment(id: number) {
    setLoading(true);
    api
      .put('/sheet/player/equipment', { id, npcId: props.npcId })
      .then((res) => {
        const equipment = res.data.equipment as EquipmentWithDefect;
        setPlayerEquipments([...playerEquipments, equipment]);

        const newEquipments = [...availableEquipments];
        newEquipments.splice(
          newEquipments.findIndex((equipment) => equipment.id === id),
          1
        );
        setAvailableEquipments(newEquipments);
      })
      .catch(logError)
      .finally(() => {
        setAddEquipmentShow(false);
        setLoading(false);
      });
  }

  function onDeleteEquipment(id: number) {
    const newPlayerEquipments = [...playerEquipments];
    const index = newPlayerEquipments.findIndex((equipment) => equipment.id === id);

    newPlayerEquipments.splice(index, 1);
    setPlayerEquipments(newPlayerEquipments);

    const modalEquipment = { id, name: playerEquipments[index].name };
    setAvailableEquipments([...availableEquipments, modalEquipment]);
  }

  return (
    <>
      <DataContainer
        outline
        title={props.title}
        addButton={{ onAdd: () => setAddEquipmentShow(true), disabled: loading }}>
        <Row className='mb-3 justify-content-center'>
          <Col xs='auto'>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => {
                setEquipmentEditorData(undefined);
                setEquipmentEditorOperation('create');
                setEquipmentEditorModalShow(true);
              }}
            >
              + Criar Arma Customizada
            </Button>
          </Col>
        </Row>

        <Row>
          {playerEquipments.map((equipment) => (
            <PlayerEquipmentField
              key={equipment.id}
              equipment={equipment}
              onDelete={onDeleteEquipment}
              showDiceRollResult={rollDice}
              npcId={props.npcId}
              onEditBase={() => {
                setEquipmentEditorData(equipment);
                setEquipmentEditorOperation('edit');
                setEquipmentEditorModalShow(true);
              }}
            />
          ))}
        </Row>
      </DataContainer>
      <AddDataModal
        title='Adicionar Equipamento'
        show={addEquipmentShow}
        onHide={() => setAddEquipmentShow(false)}
        data={availableEquipments}
        onAddData={onAddEquipment}
        disabled={loading}
      />
      <EquipmentEditorModal
        show={equipmentEditorModalShow}
        onHide={() => setEquipmentEditorModalShow(false)}
        data={equipmentEditorData as EquipmentWithDefect}
        operation={equipmentEditorOperation}
        onSubmit={(equipment) => {
          if (equipmentEditorOperation === 'create') onEquipmentCreateSubmit(equipment);
          else onEquipmentEditSubmit(equipment);
        }}
        disabled={loading}
      />
      <DiceRollModal {...diceRoll} />
    </>
  );
}

type PlayerEquipmentFieldProps = {
  equipment: EquipmentWithDefect;
  onDelete: (id: number) => void;
  showDiceRollResult: DiceRollEvent;
  onEditBase: () => void;
  npcId?: number;
};

function PlayerEquipmentField({
  equipment,
  onDelete,
  showDiceRollResult,
  onEditBase,
  npcId
}: PlayerEquipmentFieldProps) {
  const logError = useContext(ErrorLogger);
  const [loading, setLoading] = useState(false);
  const [currentAmmo, setCurrentAmmo] = useState(equipment.ammo);

  function deleteEquipment() {
    if (!confirm('Tem certeza que deseja apagar essa arma/equipamento?')) return;
    setLoading(true);
    api
      .delete('/sheet/player/equipment', { data: { id: equipment.id, npcId } })
      .then(() => {
        onDelete(equipment.id);
      })
      .catch(logError)
      .finally(() => setLoading(false));
  }

  function diceRoll() {
    const aux = resolveDices(equipment.damage);
    if (aux) showDiceRollResult({ dices: aux, broadcast: false });
  }

  return (
    <Col xs={12} className='mb-3 w-100 text-center'>
      <Row>
        <Col className='data-container mx-3'>
          <Row className='mt-2'>
            <Col
              className='h2'
              onDoubleClick={onEditBase}
              title="Dê um duplo clique para editar este equipamento."
              style={{ cursor: 'pointer', color: '#ddaf0f', textDecoration: 'underline' }}
            >
              {equipment.name}
              <Button
                aria-label='Apagar'
                className='ms-3'
                variant='secondary'
                size='sm'
                style={{ verticalAlign: 'middle', textDecoration: 'none' }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEquipment();
                }}
                disabled={loading}>
                {loading ? <CustomSpinner /> : 'Apagar'}
              </Button>
            </Col>
          </Row>
          <Row className='mb-2'>
            <Col>Tipo: {equipment.type}</Col>
          </Row>
          <Row className='mb-2'>
            <Col>
              <span className='me-1'>Dano: {equipment.damage} </span>
              {equipment.damage !== '-' && (
                <Image
                  alt='Dado'
                  src='/dice20.png'
                  className='clickable'
                  onClick={diceRoll}
                  style={{ maxHeight: '2rem' }}
                />
              )}
            </Col>
          </Row>
          <Row className='mb-2'>
            <Col>Alcance: {equipment.range}</Col>
          </Row>
          <Row className='mb-2'>
            <Col>Ataques: {equipment.attacks}</Col>
          </Row>

          {/* EXIBIÇÃO DO DEFEITO */}
          {equipment.defeito && equipment.defeito !== '-' && (
            <Row className='mb-2'>
              <Col style={{ color: '#ff6b6b' }}>Defeito: {equipment.defeito}</Col>
            </Row>
          )}

          <Row className='mb-2'>
            <Col>Munição: {currentAmmo}</Col>
          </Row>
          <Row className='mb-2'>
            <Col>Espaços: {equipment.slots}</Col>
          </Row>
        </Col>
      </Row>
    </Col>
  );
}
