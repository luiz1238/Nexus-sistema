import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/database';
import { sessionAPI } from '../../../../utils/session';
import { broadcast } from '../../../../utils/broadcast';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(401).end();
    return;
  }

  const player = req.session.player;
  if (!player) {
    res.status(401).end();
    return;
  }

  const npcId: number | undefined = req.body.npcId;
  const targetPlayerId: number | undefined = req.body.playerId;

  let playerId = player.id;
  if (player.admin) {
    if (npcId) playerId = npcId;
    else if (targetPlayerId) playerId = targetPlayerId;
    else {
      res.status(401).end();
      return;
    }
  }

  const infoID: number | undefined = parseInt(req.body.id);
  if (!infoID) {
    res.status(401).send({ message: 'ID da informação está em branco.' });
    return;
  }

  const value: string | undefined = req.body.value;

  const info = await prisma.playerInfo.update({
    where: {
      player_id_info_id: {
        player_id: playerId,
        info_id: infoID,
      },
    },
    data: { value },
  });

  res.end();

  broadcast('playerInfoChange', {
    playerId,
    infoId: infoID,
    value: info.value,
  });
}

export default sessionAPI(handler);
