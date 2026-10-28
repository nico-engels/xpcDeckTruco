import { UserRepository } from '@app/repository/user';
import { authentication, generateAccessTok, saltRandom } from '@app/util';
import { Logger } from '@app/util/logger';
import {
  AuthenticationErrorCodes,
  ChangePasswordInput,
  ChangePasswordResult,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
} from '@usecase/authentication-interfaces';
import { UsecaseError } from '@usecase/usecase-error';

export class AuthenticationError extends UsecaseError<AuthenticationErrorCodes> {};

export class AuthenticationUsecase
{
  constructor(
    private userRepo: UserRepository,
    private logger: Logger,
  ) {}

  public async login(input: LoginInput): Promise<LoginResult> {
    const { username, email, rpAddress, password } = input;

    if (rpAddress) {
      throw new AuthenticationError(AuthenticationErrorCodes.NOT_IMPLEMENTED);
    }

    const user =
      username ? await this.userRepo.getUserByUsername(username) :
        email ? await this.userRepo.getUserByEmail(email) :
          null;

    this.logger.info(`${user ? 'Found' : 'Not found' } user in repository by '${username ?? ' '}/${email ?? '-'}'`);

    if (!user) {
      throw new AuthenticationError(AuthenticationErrorCodes.UNAUTHORIZED, 'Username/E-mail or password not match!');
    }

    const expectedHash = authentication(user.salt!, password);
    if (user.hashedPasswd! !== expectedHash) {
      this.logger.warn('Invalid password');
      throw new AuthenticationError(AuthenticationErrorCodes.UNAUTHORIZED, 'Username/E-mail or password not match!');
    }

    const jwtToken = generateAccessTok(user.username, user.id!);

    return {
      userId: user.id!,
      jwtToken,
    };
  }

  public async register(input: RegisterInput): Promise<RegisterResult> {
    const { token: { username: tokenUsername }, username, email, rpAddress, password } = input;

    if (tokenUsername !== 'xpcUsrCreator') {
      throw new AuthenticationError(AuthenticationErrorCodes.UNAUTHORIZED);
    }

    if (!email && !rpAddress) {
      throw new AuthenticationError(AuthenticationErrorCodes.INVALID_INPUT, 'Need e-mail or xrp-address!');
    }

    let username_valid = username;
    if (!username) {
      if (email) {
        username_valid = email.split('@')[0];
      } else {
        username_valid = rpAddress;
      }
    }

    if (!username_valid) {
      throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'Invalid username!');
    }

    const existingUsername = await this.userRepo.getUserByUsername(username_valid);
    if (existingUsername) {
      throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'Username already registred!');
    }

    if (rpAddress) {
      const existingRpAddress = await this.userRepo.getUserByRpAddress(rpAddress);
      if (existingRpAddress) {
        throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'Xrp-address already registred!');
      }
    }

    if (email) {
      const existingUser = await this.userRepo.getUserByEmail(email);
      if (existingUser) {
        throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'E-mail already registred!');
      }
    }

    if (!password || password.length < 6) {
      throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'Password need to be at least 6 caracters!');
    }

    const salt = saltRandom();

    const user = await this.userRepo.createUser({
      username: username_valid,
      email,
      rpAddress,
      salt,
      passwd: authentication(salt, password),
    });

    const jwtToken = generateAccessTok(user.username, user.id!);

    return {
      userId: user.id!,
      jwtToken,
      message: 'ok',
    };
  }

  public async changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
    const { token: { username: tokenUsername }, oldPassword, newPassword } = input;

    const user = await this.userRepo.getUserByUsername(tokenUsername);
    if (!user) {
      throw new AuthenticationError(AuthenticationErrorCodes.NOT_FOUND, `Username '${tokenUsername}' not exist!`);
    }

    const expectedHash = authentication(user.salt!, oldPassword);
    if (user.passwd !== expectedHash) {
      throw new AuthenticationError(AuthenticationErrorCodes.UNAUTHORIZED, 'old password not match!');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AuthenticationError(AuthenticationErrorCodes.BUSINESS, 'Password need to be at least 6 caracters!');
    }

    const salt = saltRandom();

    user.salt = salt;
    user.passwd = authentication(salt, newPassword);

    await this.userRepo.updateUser(user);

    return {
      userId: user.id!,
      message: 'ok',
    };
  }
}