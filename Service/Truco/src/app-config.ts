import { boolean, create, enums, Infer, number, object, optional, string } from "superstruct";

export enum Persistence {
  none = 'none',
  typeOrmSqlite = 'typeorm-sqlite',
  dynamoAws = 'dynamodb-aws',
};

const appConfigSchema = object({
  httpPort: number(),
  mainPersistence: enums(Object.values(Persistence)),
  security: object({
    tokSecret: string(),
    preAuthGameValidateDevice: boolean(),
    generalSalt: string(),
  }),
  specialUsersPass: object({
    xtAdmin: string(),
    xpcUsrCreator: string(),
    liza: string(),
    roque: string(),
  }),
  awsConfig: optional(object({
    region: string(),
    accessKeyId: string(),
    secretAccessKey: string(),
    endpoint: string(),
  })),
});

const awsConfig =
  process.env.AWS_REGION || process.env.AWS_ACCESS_KEY_ID ||
  process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_LOCALSTACK_OVERRIDE ?
  {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    endpoint: process.env.AWS_LOCALSTACK_OVERRIDE!,
  } : undefined;

const config: Infer<typeof appConfigSchema> = {
  httpPort: (Number(process.env.HTTP_PORT) || 7777) as number,
  mainPersistence: process.env.MAIN_PERSISTENCE! as Persistence,
  security: {
    tokSecret: process.env.TOK_SECRET!,
    preAuthGameValidateDevice: process.env.PREAUTH_VALIDATE_DEVICE !== 'false',
    generalSalt: process.env.FIXSTR!,
  },
  specialUsersPass: {
    xtAdmin: process.env.SP_USER_XT_ADMIN!,
    xpcUsrCreator: process.env.SP_USER_XPCUSRCREATOR!,
    liza: process.env.SP_USER_CPU_LIZA!,
    roque: process.env.SP_USER_CPU_ROQUE!,
  },
  awsConfig,
} as const;

export const AppConfig = create(config, appConfigSchema);