import { DataSource } from 'typeorm';

import { makeTypeOrmSqliteConnection } from '@app/repository/typeorm-data-source';
import { usersModel } from '@app/repository/typeorm-users-model';
import { UserRepository, users } from '@app/repository/user';
import { Logger } from '@app/util/logger';

export function fromDatabase(model: usersModel): users {
  return {
    id: model.id,
    username: model.username!,
    email: model.email,
    rpAddress: model.rpAddress,
    hashedPasswd: model.passwd,
    salt: model.salt!,
  };
}

export class TypeOrmUserRepository extends UserRepository {
  private dataSource: DataSource;

  constructor(private logger: Logger) {
    super();
    this.dataSource = makeTypeOrmSqliteConnection(logger);
  }

  public async createUser(user: users): Promise<users> {
    return await this.dataSource.getRepository(usersModel).save(user);
  }

  public async getUserByEmail(email: string): Promise<users | null> {
    const user = await this.dataSource.getRepository(usersModel).findOneBy({ email });

    return user ? fromDatabase(user) : null;
  }

  public async getUserByRpAddress(rpAddress: string): Promise<users | null> {
    const user = await this.dataSource.getRepository(usersModel).findOneBy({ rpAddress });

    return user ? fromDatabase(user) : null;
  }

  public async getUserByUsername(username: string): Promise<users | null> {
    const user = await this.dataSource.getRepository(usersModel).findOneBy({ username });

    return user ? fromDatabase(user) : null;
  }

  public async updateUser(user: users): Promise<users> {
    return await this.dataSource.getRepository(usersModel).save(user);
  }

  public async initializeDbEngine(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }
}