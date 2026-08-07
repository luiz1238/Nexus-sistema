import type { Equipment } from '@prisma/client';
import { ChangeEvent, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import FormCheck from 'react-bootstrap/FormCheck';
import FormLabel from 'react-bootstrap/FormLabel';
import SheetModal from './SheetModal';

export type EquipmentWithDefect = Equipment & {
  defeito?: string;
};

const initialState: EquipmentWithDefect = {
  id: 0,
  name: '',
  type: '',
  damage: '',
  range: '',
  attacks: '',
  ammo: 0,
  slots: 0,
  visible: true,
  defeito: '',
};

export default function EquipmentEditorModal(props: EditorModalProps<EquipmentWithDefect>) {
  const [equipment, setEquipment] = useState<EquipmentWithDefect>(initialState);

  useEffect(() => {
    if (!props.data) return;
    setEquipment(props.data);
  }, [props.data]);

  function hide() {
    setEquipment(initialState);
    props.onHide();
  }

  function onAmmoChange(ev: ChangeEvent<HTMLInputElement>) {
    const aux = ev.target.value;
    let newAmmo = parseInt(aux);

    if (aux.length === 0) newAmmo = 0;
    else if (isNaN(newAmmo)) return;

    setEquipment((eq) => ({ ...eq, ammo: newAmmo }));
  }

  function onSlotsChange(ev: ChangeEvent<HTMLInputElement>) {
    const aux = ev.target.value;
    let newSlots = parseInt(aux);

    if (aux.length === 0) newSlots = 0;
    else if (isNaN(newSlots)) return;

    setEquipment((eq) => ({ ...eq, slots: newSlots }));
  }

  return (
    <SheetModal
      animation={false}
      title={props.operation === 'create' ? 'Criar Equipamento' : 'Editar Equipamento'}
      show={props.show}
      onHide={hide}
      applyButton={{
        name: props.operation === 'create' ? 'Criar' : 'Editar',
        onApply: () => {
          props.onSubmit(equipment);
          hide();
        },
        disabled: props.disabled,
      }}
      scrollable>
      <Container fluid>
        <FormGroup controlId='createEquipmentName' className='mb-3'>
          <FormLabel>Nome</FormLabel>
          <FormControl
            autoFocus
            className='theme-element'
            value={equipment.name}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, name: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentType' className='mb-3'>
          <FormLabel>Tipo</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.type}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, type: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentDamage' className='mb-3'>
          <FormLabel>Dano</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.damage}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, damage: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentRange' className='mb-3'>
          <FormLabel>Alcance</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.range}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, range: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentAttacks' className='mb-3'>
          <FormLabel>Ataques</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.attacks}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, attacks: ev.target.value }))}
          />
        </FormGroup>

        {/* NOVO CAMPO: Defeito */}
        <FormGroup controlId='createEquipmentDefeito' className='mb-3'>
          <FormLabel>Defeito</FormLabel>
          <FormControl
            className='theme-element'
            placeholder='Ex: Emperra com 1, Avaria no gatilho, etc.'
            value={equipment.defeito || ''}
            onChange={(ev) => setEquipment((eq) => ({ ...eq, defeito: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentAmmo' className='mb-3'>
          <FormLabel>Munição</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.ammo}
            onChange={onAmmoChange}
          />
        </FormGroup>

        <FormGroup controlId='createEquipmentSlots' className='mb-3'>
          <FormLabel>Espaços</FormLabel>
          <FormControl
            className='theme-element'
            value={equipment.slots}
            onChange={onSlotsChange}
          />
        </FormGroup>

        <FormCheck
          inline
          checked={equipment.visible}
          onChange={(ev) => setEquipment((eq) => ({ ...eq, visible: ev.target.checked }))}
          id='createEquipmentVisible'
          label='Visível?'
        />
      </Container>
    </SheetModal>
  );
}
