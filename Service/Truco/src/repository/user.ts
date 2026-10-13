import { AppConfig } from "@app/app-config";
import { BaseRepository } from "@app/repository/base-repository";
import { authentication, saltRandom } from "@app/util";

export interface users {
  id?: number;
  username: string;
  email?: string;
  rpAddress?: string;
  passwd?: string;
  hashedPasswd?: string;
  salt: string;
}

export abstract class UserRepository extends BaseRepository {
  public async createSpecialUsers(): Promise<void> {
    const usrs = [
      {
        username: 'xt-admin',
        plain_passwd: AppConfig.specialUsersPass.xtAdmin,
        salt: saltRandom(),
      },
      {
        username: 'xpcUsrCreator',
        plain_passwd: AppConfig.specialUsersPass.xpcUsrCreator,
        salt: saltRandom(),
      },
      {
        username: 'liza(cpu)',
        plain_passwd: AppConfig.specialUsersPass.liza,
        salt: saltRandom(),
      },
      {
        username: 'roque(cpu)',
        plain_passwd: AppConfig.specialUsersPass.roque,
        salt: saltRandom(),
      },
    ];

    console.log('Creating special users...');
    await this.initializeDbEngine();

    for (const usr of usrs) {
      let msg = `Creating user ${usr.username} `;

      try {
        await this.createUser({
          username: usr.username,
          salt: usr.salt,
          passwd: authentication(usr.salt, usr.plain_passwd),
        });

        msg += 'ok';
      } catch (error) {
        msg += `err ${error}`;
      }
      console.log(msg);
    }
  }

  public abstract createUser(user: users): Promise<users>;
  public abstract getUserByEmail(email: string): Promise<users | null>;
  public abstract getUserByRpAddress(rpAddress: string): Promise<users | null>;
  public abstract getUserByUsername(username: string): Promise<users | null>;
  public abstract updateUser(user: users): Promise<users>;

  public abstract initializeDbEngine(): Promise<void>;
};