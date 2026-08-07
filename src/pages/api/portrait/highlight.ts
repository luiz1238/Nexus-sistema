import type { NextApiRequest, NextApiResponse } from 'next';
import { broadcast } from '../../../utils/broadcast';
import { sessionAPI } from '../../../utils/session';
import prisma from '../../../utils/database';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(404).end();
    return;
  }

  const player = req.session.player;
  if (!player || !player.admin) {
    res.status(401).end();
    return;
  }

  const { playerId } = req.body;
  let { color } = req.body;

  // Se a cor não foi passada manualmente, busca a cor do atributo principal do personagem no banco
  if (playerId && !color) {
    const playerAttribute = await prisma.playerAttribute.findFirst({
      where: {
        player_id: playerId,
        Attribute: { portrait: 'PRIMARY' },
      },
      select: {
        Attribute: {
          select: { color: true },
        },
      },
    });

    if (playerAttribute?.Attribute?.color) {
      color = playerAttribute.Attribute.color;
    }
  }

  // Garante a presença do símbolo '#' no código hexadecimal
  if (color && !color.startsWith('#')) {
    color = `#${color}`;
  }

  broadcast('portraitHighlight', {
    playerId: playerId ?? null,
    color: color || '#ddaf0f',
  });

  res.status(200).end();
}

export default sessionAPI(handler);
