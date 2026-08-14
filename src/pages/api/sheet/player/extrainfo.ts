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

  const extraInfoID: number | undefined = parseInt(req.body.id);
  if (!extraInfoID) {
    res.status(401).send({ message: 'ID da informação extra está em branco.' });
    return;
  }

  const value: string | undefined = req.body.value;

  const extraInfo = await prisma.playerExtraInfo.update({
    where: {
      player_id_extra_info_id: {
        player_id: playerId,
        extra_info_id: extraInfoID,
      },
    },
    data: { value },
  });

  res.end();

  broadcast('playerExtraInfoChange', {
    playerId,
    extraInfoId: extraInfoID,
    value: extraInfo.value,
  });
}

export default sessionAPI(handler);
