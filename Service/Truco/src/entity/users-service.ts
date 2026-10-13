/*
export async function getUserByUsername(username: string) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await getUserByUsernameRepo(username);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await getUserByUsernameDyndb(username);
  } else {
    throw new Error('getUserByUsername is not implemented for this persistence');
  }
}

export async function getUserByRpAddress(rpAddress: string) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await getUserByRpAddressRepo(rpAddress);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await getUserByRpAddressDyndb(rpAddress);
  } else {
    throw new Error('getUserByRpAddress is not implemented for this persistence');
  }
}

export async function getUserByEmail(email: string) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await getUserByEmailRepo(email);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await getUserByEmailDyndb(email);
  } else {
    throw new Error('getUserByEmail is not implemented for this persistence');
  }
}

export async function createUser(user: usersModel) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await createUserRepo(user);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await createUserDyndb(user);
  } else {
    throw new Error('createUser is not implemented for this persistence');
  }
}

export async function updateUser(user: usersModel) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await updateUserRepo(user);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await updateUserDyndb(user);
  } else {
    throw new Error('updateUser is not implemented for this persistence');
  }
}

export async function createPreAuthGame(pag: preAuthGamesModel) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await createPreAuthGameRepo(pag);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await createPreAuthGameRepoDyndb(pag);
  } else {
    throw new Error('createPreAuthGame is not implemented for this persistence');
  }
}

export async function updatePreAuthGame(pag: preAuthGamesModel) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await updatePreAuthGameRepo(pag);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await updatePreAuthGameDyndb(pag);
  } else {
    throw new Error('updatePreAuthGame is not implemented for this persistence');
  }
}

export async function listPreAuthGame() {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await listPreAuthGameRepo();
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await listPreAuthGameDyndb();
  } else {
    throw new Error('listPreAuthGame is not implemented for this persistence');
  }
}

export async function getPreGameByLink(link: string) {
  if (AppConfig.mainPersistence === Persistence.typeOrmSqlite) {
    return await getPreGameByLinkRepo(link);
  } else if (AppConfig.mainPersistence === Persistence.dynamoAws) {
    return await getPreGameByLinkDyndb(link);
  } else {
    throw new Error('getPreGameByLink is not implemented for this persistence');
  }
}
*/