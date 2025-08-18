import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("produtos")
export class Produto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column()
  cor!: string;

  @Column()
  tipo_parede!: string;

  @Column()
  ambiente!: string;

  @Column()
  acabamento!: string;

  @Column("simple-array", { nullable: true }) // array de features no formato CSV
  features!: string[];

  @Column()
  linha!: string;
}
