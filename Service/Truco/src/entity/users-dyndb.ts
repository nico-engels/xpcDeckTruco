/*
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { dyndoclient } from '@app/entity/data-source-dyndb';
import { getGameByIdDyndb } from '@app/entity/games-dyndb';
import { preAuthGamesModel } from '@app/repository/typeorm-pre-auth-games-model';
import { usersModel } from '@app/repository/typeorm-users-model';
import { saltRandom } from '@app/util';

export async function getUserByUsernameDyndb(username: string) {
  const cmd = new GetCommand({
    TableName: 'users',
    Key: {
      username,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (!res?.Item) {
    return null;
  }

  return res.Item as usersModel;
}

export async function getUserByEmailDyndb(email: string) {
  const cmd = new ScanCommand({
    TableName: 'users',
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  });

  const res = await dyndoclient.send(cmd);

  return res.Items?.[0] as usersModel;
}

export async function createUserDyndb(user: usersModel) {
  if (!user.id) {
    user.id = Math.floor(Math.random() * 1024);
  }

  const cmd = new PutCommand({
    TableName: 'users',
    Item: user,
  });

  await dyndoclient.send(cmd);

  return user;
}

export async function listPreAuthGameDyndb() {
  const cmd = new ScanCommand({
    TableName: 'pre-auth-games',
  });

  const res = await dyndoclient.send(cmd);

  return res.Items?.map((item) => ({
    id: item.id,
    player1: item.player1_username,
    player1Link: item.player1_link,
    player2: item.player2_username,
    player2Link: item.player2_link,
    gameId: item.game_id,
  }));
}

export async function getUserByRpAddressDyndb(rpAddress: string) {
  const cmd = new ScanCommand({
    TableName: 'users',
    FilterExpression: 'rp_address = :rp_address',
    Limit: 1,
    ExpressionAttributeValues: {
      ':rp_address': rpAddress,
    },
  });

  const res = await dyndoclient.send(cmd);

  return res.Items?.[0] as usersModel;
}

export async function updateUserDyndb(user: usersModel) {
  createUserDyndb(user);
}

export async function createPreAuthGameRepoDyndb(pag: preAuthGamesModel) {
  if (!pag.player1Link) {
    pag.player1Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');
  }

  if (!pag.player2Link) {
    pag.player2Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');
  }

  if (!pag.id) {
    pag.id = Math.floor(Math.random() * 1024);
  }

  const pagDoc = {
    id: pag.id,
    player1_username: pag.game?.player1?.username,
    player1_link: pag.player1Link,
    player1_deviceid: pag.player1DeviceId,
    player2_username: pag.game?.player2?.username,
    player2_link: pag.player2Link,
    player2_deviceid: pag.player2DeviceId,
    game_id: pag.game?.id,
  };

  const cmd = new PutCommand({
    TableName: 'pre-auth-games',
    Item: pagDoc,
  });

  await dyndoclient.send(cmd);

  return pag;
}

export async function getPreGameByLinkDyndb(link: string) {
  const cmd = new ScanCommand({
    TableName: 'pre-auth-games',
    FilterExpression: '(player1_link = :link or player2_link = :link)',
    ExpressionAttributeValues: {
      ':link': link,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (!res.Items?.length) {
    return null;
  }

  const pagDoc = res.Items[0];
  const game = await getGameByIdDyndb(pagDoc.game_id);

  return {
    id: pagDoc.id,
    player1Link: pagDoc.player1_link,
    player1DeviceId: pagDoc.player1_deviceid,
    player2Link: pagDoc.player2_link,
    game: {
      id: pagDoc.game_id,
      player1: game.player1,
      player2: game.player2,
    },
  } as preAuthGamesModel;
}

export async function updatePreAuthGameDyndb(pag: preAuthGamesModel) {
  createPreAuthGameRepoDyndb(pag);
}
*/