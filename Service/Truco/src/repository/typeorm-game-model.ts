import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Uses import type to avoid circular references
import type { preAuthGamesModel } from '@app/repository/typeorm-pre-auth-games-model';
import type { roundsModel } from '@app/repository/typeorm-round-model';
import type { usersModel } from '@app/repository/typeorm-users-model';

@Entity({
  name: 'games',
})
export class gamesModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne('users', 'games1')
  player1?: usersModel;

  @ManyToOne('users', 'games2')
  player2?: usersModel;

  @Column({
    type: 'int',
  })
  player1Score?: number;

  @Column({
    type: 'int',
  })
  player2Score?: number;

  @CreateDateColumn()
  startPlay?: Date;

  @UpdateDateColumn()
  lastPlay?: Date;

  @Column({
    nullable: true,
    type: 'datetime',
  })
  endPlay?: Date;

  @OneToMany('rounds', 'game')
  rounds?: roundsModel[];

  @ManyToOne('users', 'winners')
  winnerPlayer?: usersModel;

  @OneToMany('pre_auth_games', 'game')
  preAuthGames?: preAuthGamesModel[];
}
