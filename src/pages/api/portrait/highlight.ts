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

  // Se a cor não veio na requisição, consulta no banco a cor do atributo principal do personagem
  if (playerId && !color) {
    try {
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
    } catch (e) {
      console.error('Erro ao buscar cor do atributo:', e);
    }
  }

  // Garante a presença do símbolo '#'
  if (color && typeof color === 'string' && !color.startsWith('#')) {
    color = `#${color}`;
  }

  const finalColor = color || '#ddaf0f';

  broadcast('portraitHighlight', {
    playerId: playerId ?? null,
    color: finalColor,
  });

  res.status(200).end();
}

export default sessionAPI(handler);
