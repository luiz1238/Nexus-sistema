import type { NextApiRequest, NextApiResponse } from 'next';
import database from '../../../utils/database';
import { sessionAPI } from '../../../utils/session';
import { broadcast } from '../../../utils/broadcast';

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'PUT') return handlePut(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.status(404).end();
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;

  if (!player) {
    res.status(401).end();
    return;
  }

  const id: number | undefined = req.body.id;
  const name: string | undefined = req.body.name;
  const damage: string | undefined = req.body.damage;
  const description: string | undefined = req.body.description;
  const cost: string | undefined = req.body.cost;
  const type: string | undefined = req.body.type;
  const target: string | undefined = req.body.target;
  const castingTime: string | undefined = req.body.castingTime;
  const range: string | undefined = req.body.range;
  const duration: string | undefined = req.body.duration;
  const slots: number | undefined = req.body.slots;
  const visible: boolean | undefined = req.body.visible;

  // Novos campos com valor padrão "-" caso venham vazios
  const sanity: string = req.body.sanity || '-';
  const resistance: string = req.body.resistance || '-';
  const symbol: string = req.body.symbol || '-';

  if (
    !id ||
    !name ||
    !damage ||
    !description ||
    !cost ||
    !type ||
    !target ||
    !castingTime ||
    !range ||
    !duration ||
    slots === undefined ||
    visible === undefined
  ) {
    res.status(400).send({ message: 'Algum campo da magia está em branco.' });
    return;
  }

  const spell = await database.spell.update({
    where: { id },
    data: {
      name,
      damage,
      description,
      cost,
      type,
      target,
      castingTime,
      range,
      duration,
      slots,
      visible,
      sanity,
      resistance,
      symbol,
    },
  });

  res.end();

  broadcast('spellChange', { spell });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;

  if (!player) {
    res.status(401).end();
    return;
  }

  const name: string | undefined = req.body.name;
  const description: string | undefined = req.body.description;
  const cost: string | undefined = req.body.cost;
  const type: string | undefined = req.body.type;
  const damage: string | undefined = req.body.damage;
  const castingTime: string | undefined = req.body.castingTime;
  const range: string | undefined = req.body.range;
  const duration: string | undefined = req.body.duration;
  const target: string | undefined = req.body.target;
  const slots: number | undefined = req.body.slots;

  // Novos campos com valor padrão "-" caso venham vazios
  const sanity: string = req.body.sanity || '-';
  const resistance: string = req.body.resistance || '-';
  const symbol: string = req.body.symbol || '-';

  if (
    !name ||
    !description ||
    !cost ||
    !type ||
    !damage ||
    !castingTime ||
    !range ||
    !duration ||
    !target ||
    slots === undefined
  ) {
    res.status(400).send({
      message: 'Algum campo da magia está em branco.',
    });
    return;
  }

  const spell = await database.spell.create({
    data: {
      name,
      description,
      cost,
      type,
      damage,
      slots,
      target,
      castingTime,
      range,
      duration,
      visible: true,
      sanity,
      resistance,
      symbol,
    },
  });

  res.send({ id: spell.id });

  broadcast('spellAdd', { id: spell.id, name: spell.name });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;

  if (!player || !player.admin) {
    res.status(401).end();
    return;
  }

  const id: number | undefined = req.body.id;

  if (!id) {
    res.status(401).send({ message: 'ID da magia está em branco.' });
    return;
  }

  await database.spell.delete({ where: { id } });

  res.end();

  broadcast('spellRemove', { id });
}

export default sessionAPI(handler);
