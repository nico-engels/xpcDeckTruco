import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

// Uses import type to avoid circular references
import type { gamesModel } from '@app/repository/typeorm-game-model';
import type { roundsModel } from '@app/repository/typeorm-round-model';
import type { turnsModel } from '@app/repository/typeorm-turn-model';

@Entity({
  name: 'users',
})
export class usersModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    length: 35,
    type: 'varchar',
    unique: true,
  })
  username?: string;

  @Column({
    length: 150,
    nullable: true,
    type: 'varchar',
    unique: true,
  })
  email?: string;

  @Column({
    length: 35,
    nullable: true,
    type: 'varchar',
    unique: true,
  })
  rpAddress?: string;

  @Column({
    length: 200,
    nullable: true,
    type: 'varchar',
  })
  passwd?: string;

  @Column({
    length: 180,
    nullable: true,
    type: 'varchar',
  })
  salt?: string;

  @OneToMany('games', 'player1')
  games1?: gamesModel[];

  @OneToMany('games', 'player2')
  games2?: gamesModel[];

  @OneToMany('rounds', 'winnerPlayer')
  roundsWinners?: roundsModel[];

  @OneToMany('rounds', 'starterPlayer')
  roundsStarters?: roundsModel[];

  @OneToMany('turns', 'player')
  turns?: turnsModel[];

  @OneToMany('games', 'winnerPlayer')
  winners?: gamesModel[];
}
