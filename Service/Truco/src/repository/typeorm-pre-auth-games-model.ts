import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

// Uses import type to avoid circular references
import type { gamesModel } from '@app/repository/typeorm-game-model';

@Entity({
  name: 'pre_auth_games',
})
export class preAuthGamesModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    length: 100,
    type: 'varchar',
  })
  player1Link?: string;

  @Column({
    length: 10,
    nullable: true,
    type: 'varchar',
  })
  player1DeviceId?: string;

  @Column({
    length: 100,
    type: 'varchar',
  })
  player2Link?: string;

  @Column({
    length: 10,
    nullable: true,
    type: 'varchar',
  })
  player2DeviceId?: string;

  @ManyToOne('games', 'preAuthGames')
  game?: gamesModel;
}
