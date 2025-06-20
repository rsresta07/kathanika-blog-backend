import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { Post } from "./entities/post.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Tag } from "../tags/entities/tag.entity";
import generateSlug from "../utils/helpers/generateSlug";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>
  ) {}

  //* Creating a post
  async create(createPostDto: CreatePostDto) {
    try {
      const { ...rest } = createPostDto;
      const post = this.postRepository.create({
        ...rest,
        title: createPostDto.title,
        content: createPostDto.description,
        image: createPostDto.image,
        slug: generateSlug(rest.title),
      });

      post.tags = await this.tagRepository.findBy({
        id: In(createPostDto.tagIds),
      });
      post.users = await this.userRepository.findBy({
        id: In(createPostDto.userIds),
      });

      await this.postRepository.save(post);
    } catch (error) {
      throw new HttpException(
        `error creating: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  //* Function to display all posts
  async findAll() {
    try {
      const posts = await this.postRepository
        .createQueryBuilder("posts")
        .leftJoinAndSelect("posts.users", "users")
        .leftJoinAndSelect("posts.tags", "tag")
        .orderBy("posts.createdAt", "DESC")
        .getMany();

      return posts.map((post) => ({
        createdAt: post.createdAt,
        id: post.id,
        title: post.title,
        content: post.content,
        image: post.image,
        slug: post.slug,
        status: post.status,
        // pick tags explicitly
        tags: post.tags.map((tag) => ({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          status: tag.status,
        })),
        // pick user fields explicitly
        users: post.users.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          slug: user.username,
        })),
      }));
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  //* Function to display active post
  async findActive() {
    try {
      const posts = await this.postRepository
        .createQueryBuilder("posts")
        .where("posts.status = :status", { status: true })
        .leftJoinAndSelect("posts.users", "users")
        .leftJoinAndSelect("posts.tags", "tag")
        .orderBy("posts.createdAt", "DESC")
        .getMany();

      return posts.map((post) => ({
        createdAt: post.createdAt,
        id: post.id,
        title: post.title,
        content: post.content,
        image: post.image,
        slug: post.slug,
        status: post.status,
        // map tags as-is or pick fields explicitly if needed
        tags: post.tags.map((tag) => ({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          status: tag.status,
        })),
        // map users, only id, fullName, and slug (from username)
        users: post.users.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          slug: user.username,
        })),
      }));
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async findOne(slug: string) {
    try {
      return await this.postRepository
        .createQueryBuilder("post")
        .where({ slug })
        .leftJoin("post.users", "users")
        .leftJoinAndSelect("post.tags", "tag")
        .addSelect(["users.id", "users.email", "users.fullName"])
        .getOneOrFail();
    } catch (error) {
      throw new HttpException(
        `error finding: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  update(id: string, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: string) {
    return `This action removes a #${id} post`;
  }

  // search post
  async searchPosts(query: string): Promise<Post[]> {
    if (!query || typeof query !== "string") {
      throw new HttpException(
        "Missing or invalid query parameter `q`",
        HttpStatus.BAD_REQUEST
      );
    }

    console.log("Search query:", query);

    try {
      return await this.postRepository.query(
        `
      SELECT  
        p.title AS name,
        p.content,
        p.slug,
        p.image
      FROM posts p
      WHERE search_vector @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
      `,
        [query]
      );
    } catch (error) {
      throw new HttpException(
        `Search failed: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
