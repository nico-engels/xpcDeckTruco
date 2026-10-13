import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

// Uses import type to avoid circular references
import type { roundsModel } from '@app/repository/typeorm-round-model';
import type { usersModel } from '@app/repository/typeorm-users-model';

@Entity({
  name: 'turns',
})
export class turnsModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne('rounds', 'turns')
  round?: roundsModel;

  @Column({
    type: 'int',
  })
  seq?: number;

  @ManyToOne('users', 'turns')
  player?: usersModel;

  @Column({
    length: 2,
    type: 'varchar',
  })
  cardOrAction?: string;

  @Column({
    type: 'datetime',
  })
  when?: Date;
}