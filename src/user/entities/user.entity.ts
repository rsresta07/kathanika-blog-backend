import { Exclude } from "class-transformer";
import { GenericEntity } from "src/core/generic.entity";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  UpdateDateColumn,
} from "typeorm";
import { Post } from "../../post/entities/post.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity("users")
export class User extends GenericEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: "varchar",
    length: 100,
    default: "slug",
  })
  slug: string;

  @Column({ type: "varchar", name: "full_name", default: "Mr. User" })
  fullName: string;

  @Exclude()
  @Column({ nullable: true })
  password?: string;

  @Column({ type: "varchar", nullable: true })
  provider: "google" | "facebook" | null;

  @Column({ type: "varchar", nullable: true })
  providerId: string | null;

  @Column({ type: "text", nullable: true })
  avatar: string | null;

  @Column({ type: "enum", enum: RoleEnum, default: RoleEnum.USER }) // Changed from SUPER_ADMIN
  role: string;

  @Column({ type: "enum", enum: StatusEnum, default: StatusEnum.APPROVED }) // Changed from PENDING
  status: StatusEnum;

  // Fix this - should be UpdateDateColumn for last_login_at
  @UpdateDateColumn()
  last_login_at: Date;

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({ name: "user_tags" })
  preferences: Tag[];
}
