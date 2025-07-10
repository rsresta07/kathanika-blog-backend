import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { Tag } from "src/tags/entities/tag.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>
  ) {}

  // helper functions

  async isAuthenticatedUser({ email }: any) {
    try {
      return await this.userRepo
        .createQueryBuilder("user")
        .where("LOWER(TRIM(user.email)) = :email", {
          email: email?.toLowerCase()?.trim(),
        })
        .getOne();
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll() {
    return this.userRepo.find();
  }

  async findOne(slug: string) {
    return this.userRepo
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.email",
        "user.slug",
        "user.fullName",
        // "user.location",
        // "user.contact",
        "user.role",
        "user.status",
      ])
      .leftJoin("user.posts", "post")
      .addSelect([
        "post.id",
        "post.title",
        "post.image",
        "post.slug",
        "post.status",
        "post.createdAt", // ← explicitly added this!
      ])
      .leftJoin("post.tags", "tag")
      .addSelect(["tag.id", "tag.title"])
      .where("user.slug = :slug", { slug })
      .orderBy("post.createdAt", "DESC") // ← alias must be "post", not "posts"
      .getOneOrFail();
  }

  async findById(id: string) {
    return this.userRepo.findOne({
      where: { id },
      select: [
        "id",
        "slug",
        "fullName",
        "email",
        // "location",
        // "contact",
        "role",
        "status",
      ],
    });
  }

  async updateMe(id: string, dto) {
    await this.userRepo.update({ id }, dto);
    return this.findById(id); // return fresh copy
  }

  async updateBySlug(slug: string, dto) {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(dto)
      .where("slug = :slug", { slug })
      .execute();
    return this.findOne(slug);
  }

  async getPreferences(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ["preferences"],
    });
    return user.preferences;
  }

  async updatePreferences(id: string, dto) {
    const tags = await this.tagRepo.findByIds(dto.tagIds); // inject TagRepository
    const user = await this.userRepo.findOneByOrFail({ id });
    user.preferences = tags;
    await this.userRepo.save(user);
    return user.preferences; // return fresh list
  }
}
