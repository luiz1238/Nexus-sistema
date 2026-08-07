import type { Spell } from '@prisma/client';
import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import FormCheck from 'react-bootstrap/FormCheck';
import FormLabel from 'react-bootstrap/FormLabel';
import SheetModal from './SheetModal';

export type RitualData = Spell & {
  sanity?: string;
  symbol?: string;
};

const initialState: RitualData = {
  id: 0,
  name: '',
  description: '',
  castingTime: '',
  cost: '',
  damage: '',
  duration: '',
  range: '',
  target: '',
  type: '',
  slots: 0,
  visible: true,
  sanity: '',
  symbol: '',
};

export default function SpellEditorModal(props: EditorModalProps<RitualData>) {
  const [spell, setSpell] = useState<RitualData>(initialState);

  useEffect(() => {
    if (!props.data) return;
    setSpell(props.data);
  }, [props.data]);

  function hide() {
    setSpell(initialState);
    props.onHide();
  }

  return (
    <SheetModal
      animation={false}
      title={props.operation === 'create' ? 'Criar Ritual' : 'Editar Ritual'}
      show={props.show}
      onHide={hide}
      applyButton={{
        name: props.operation === 'create' ? 'Criar' : 'Editar',
        onApply: () => {
          props.onSubmit(spell);
          hide();
        },
        disabled: props.disabled,
      }}
      scrollable>
      <Container fluid>
        <FormGroup controlId='createSpellName' className='mb-3'>
          <FormLabel>Nome do Ritual</FormLabel>
          <FormControl
            autoFocus
            className='theme-element'
            value={spell.name}
            onChange={(ev) => setSpell((sp) => ({ ...sp, name: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDescription' className='mb-3'>
          <FormLabel>Descrição</FormLabel>
          <FormControl
            as='textarea'
            className='theme-element'
            value={spell.description}
            onChange={(ev) => setSpell((sp) => ({ ...sp, description: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellCost' className='mb-3'>
          <FormLabel>Custo (PE)</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.cost}
            onChange={(ev) => setSpell((sp) => ({ ...sp, cost: ev.target.value }))}
          />
        </FormGroup>

        {/* Novo campo: Sanidade */}
        <FormGroup controlId='createSpellSanity' className='mb-3'>
          <FormLabel>Sanidade</FormLabel>
          <FormControl
            className='theme-element'
            placeholder='Ex: 1d6 Sanidade'
            value={spell.sanity || ''}
            onChange={(ev) => setSpell((sp) => ({ ...sp, sanity: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellType' className='mb-3'>
          <FormLabel>Elemento / Tipo</FormLabel>
          <FormControl
            className='theme-element'
            placeholder='Ex: Morte, Sangue, Conhecimento, Energia'
            value={spell.type}
            onChange={(ev) => setSpell((sp) => ({ ...sp, type: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDamage' className='mb-3'>
          <FormLabel>Dano / Efeito</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.damage}
            onChange={(ev) => setSpell((sp) => ({ ...sp, damage: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellTarget' className='mb-3'>
          <FormLabel>Alvo</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.target}
            onChange={(ev) => setSpell((sp) => ({ ...sp, target: ev.target.value }))}
          />
        </FormGroup>

        {/* Alterado de Tempo de Conjuração para Conjuração */}
        <FormGroup controlId='createSpellCastingTime' className='mb-3'>
          <FormLabel>Conjuração</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.castingTime}
            onChange={(ev) => setSpell((sp) => ({ ...sp, castingTime: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellRange' className='mb-3'>
          <FormLabel>Alcance</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.range}
            onChange={(ev) => setSpell((sp) => ({ ...sp, range: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDuration' className='mb-3'>
          <FormLabel>Duração</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.duration}
            onChange={(ev) => setSpell((sp) => ({ ...sp, duration: ev.target.value }))}
          />
        </FormGroup>

        {/* Novo campo: Símbolo (URL da Imagem) */}
        <FormGroup controlId='createSpellSymbol' className='mb-3'>
          <FormLabel>Símbolo (URL da Imagem)</FormLabel>
          <FormControl
            className='theme-element'
            placeholder='https://link-da-imagem.com/simbolo.png'
            value={spell.symbol || ''}
            onChange={(ev) => setSpell((sp) => ({ ...sp, symbol: ev.target.value }))}
          />
        </FormGroup>

        <FormCheck
          inline
          checked={spell.visible}
          onChange={(ev) => setSpell((sp) => ({ ...sp, visible: ev.target.checked }))}
          id='createSpellVisible'
          label='Visível?'
        />
      </Container>
    </SheetModal>
  );
}
