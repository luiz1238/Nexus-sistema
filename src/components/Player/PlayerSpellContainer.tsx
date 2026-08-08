import type { Spell } from '@prisma/client';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import DataContainer from '../DataContainer';

export type RitualData = Spell & {
  sanity?: string;
  symbol?: string;
  resistance?: string;
};

type PlayerSpellContainerProps = {
  playerSpells: {
    Spell: RitualData;
  }[];
};

export default function PlayerSpellContainer(props: PlayerSpellContainerProps) {
  const [selectedSpell, setSelectedSpell] = useState<RitualData | null>(null);

  return (
    <>
      <DataContainer title="Rituais" outline xs={12} lg={6}>
        <Row className="g-2">
          {props.playerSpells.length === 0 ? (
            <Col className="text-center text-muted my-3 h6">
              Nenhum ritual aprendido.
            </Col>
          ) : (
            props.playerSpells.map((ps) => (
              <Col key={ps.Spell.id} xs={12}>
                <div 
                  className="p-2 my-1 rounded border d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', cursor: 'pointer' }}
                  onClick={() => setSelectedSpell(ps.Spell)}
                >
                  <div>
                    <strong className="h6 mb-0 me-2">{ps.Spell.name}</strong>
                    {ps.Spell.type && (
                      <span className="badge bg-secondary ms-1">{ps.Spell.type}</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline-light" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSpell(ps.Spell);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </Col>
            ))
          )}
        </Row>
      </DataContainer>

      {/* Modal de Detalhes do Ritual */}
      {selectedSpell && (
        <Modal 
          show={!!selectedSpell} 
          onHide={() => setSelectedSpell(null)} 
          centered 
          size="lg"
          contentClassName="bg-dark text-white border-secondary"
        >
          <Modal.Header closeButton closeVariant="white" className="border-secondary">
            <Modal.Title className="d-flex align-items-center gap-2">
              <span>{selectedSpell.name}</span>
              {selectedSpell.type && (
                <span className="badge" style={{ backgroundColor: '#8a2be2' }}>
                  {selectedSpell.type}
                </span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Exibição do Símbolo se existir */}
            {selectedSpell.symbol && selectedSpell.symbol !== '-' && (
              <div className="text-center mb-3">
                <img 
                  src={selectedSpell.symbol} 
                  alt={selectedSpell.name} 
                  style={{ maxHeight: '120px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Tabela de Atributos/Estatísticas do Ritual */}
            <Row className="mb-3 g-2 text-center">
              {selectedSpell.cost && selectedSpell.cost !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Custo</small>
                    <strong>{selectedSpell.cost}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.sanity && selectedSpell.sanity !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Sanidade</small>
                    <strong>{selectedSpell.sanity}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.damage && selectedSpell.damage !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Dano / Efeito</small>
                    <strong>{selectedSpell.damage}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.target && selectedSpell.target !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Alvo</small>
                    <strong>{selectedSpell.target}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.castingTime && selectedSpell.castingTime !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Conjuração</small>
                    <strong>{selectedSpell.castingTime}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.range && selectedSpell.range !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Alcance</small>
                    <strong>{selectedSpell.range}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.duration && selectedSpell.duration !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Duração</small>
                    <strong>{selectedSpell.duration}</strong>
                  </div>
                </Col>
              )}
              {selectedSpell.resistance && selectedSpell.resistance !== '-' && (
                <Col xs={6} sm={4} md={3}>
                  <div className="p-2 border rounded bg-secondary bg-opacity-10">
                    <small className="text-muted d-block">Resistência</small>
                    <strong>{selectedSpell.resistance}</strong>
                  </div>
                </Col>
              )}
            </Row>

            <hr className="border-secondary" />

            {/* Descrição Formatada com Suporte a Parágrafos e Enters */}
            <div>
              <h6 className="fw-bold mb-2">Descrição:</h6>
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  lineHeight: '1.6' 
                }}
              >
                {selectedSpell.description || 'Sem descrição disponível.'}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-secondary">
            <Button variant="secondary" onClick={() => setSelectedSpell(null)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
