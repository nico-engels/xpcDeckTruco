import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';

// Uses import type to avoid circular references
import type { gamesModel } from '@app/repository/typeorm-game-model';
import type { turnsModel } from '@app/repository/typeorm-turn-model';
import type { usersModel } from '@app/repository/typeorm-users-model';

@Entity({
  name: 'rounds',
})
export class roundsModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne('games', 'rounds')
  game?: gamesModel;

  @Column({
    type: 'int',
  })
  seq?: number;

  @Column({
    length: 6,
    type: 'varchar',
  })
  player1Cards?: string;

  @Column({
    length: 6,
    type: 'varchar',
  })
  player2Cards?: string;

  @Column({
    length: 2,
    type: 'varchar',
  })
  trumpCard?: string;

  @ManyToOne('users', 'roundsStarters')
  starterPlayer?: usersModel;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  finished?: boolean;

  @ManyToOne('users', 'roundsWinners')
  winnerPlayer?: usersModel;

  @Column({
    nullable: true,
    type: 'int',
  })
  score?: number;

  @OneToMany('turns', 'round')
  turns?: turnsModel[];
}