import { TypeOrmUserRepository } from '@app/repository/typeorm-user';
import { ConsoleLogger } from '@app/util/logger';

const logger = new ConsoleLogger();
const repo = new TypeOrmUserRepository(logger);

await repo.createSpecialUsers();
