import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/database';
import { sessionAPI } from '../../../../../utils/session';
import { broadcast } from '../../../../../utils/broadcast';

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

  const skillID: number | undefined = parseInt(req.body.id);
  if (!skillID) {
    res.status(401).send({ message: 'ID da perícia está em branco.' });
    return;
  }

  const value: number | undefined = req.body.value;
  const checked: boolean | undefined = req.body.checked;

  const skill = await prisma.playerSkill.update({
    where: {
      player_id_skill_id: {
        player_id: playerId,
        skill_id: skillID,
      },
    },
    data: { value, checked },
  });

  res.end();

  broadcast('playerSkillChange', {
    playerId,
    skillId: skillID,
    value: skill.value,
    checked: skill.checked,
  });
}

export default sessionAPI(handler);
