import { Infer, number, object, optional, string } from 'superstruct';

export const AppTokenSchema = object({
  userId: number(),
  username: string(),
  gameId: optional(number()),
});

export type AppToken = Infer<typeof AppTokenSchema>;
