import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { LoginAuthDto, OauthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { BcryptService } from "./bcryptjs/bcrypt.service";
import { UserService } from "src/user/user.service";
import { JwtService } from "@nestjs/jwt";

import "dotenv/config";
import { RoleEnum, StatusEnum } from "src/utils/enum/role";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DataSource, Repository } from "typeorm";
import generateSlug from "src/utils/helpers/generateSlug";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly bcryptService: BcryptService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  async handleOauth(dto: OauthDto) {
    try {
      let user = await this.userRepo.findOne({
        where: [
          { provider: dto.provider, providerId: dto.providerId },
          { email: dto.email },
        ],
      });

      if (!user) {
        user = this.userRepo.create({
          email: dto.email,
          fullName: dto.fullName,
          provider: dto.provider,
          providerId: dto.providerId,
          avatar: dto.avatar,
          slug: generateSlug(dto?.fullName),
          role: RoleEnum.USER,
          status: StatusEnum.APPROVED,
          last_login_at: new Date(),
        });
      } else {
        user.fullName = dto.fullName;
        user.avatar = dto.avatar;
        user.provider = dto.provider;
        user.providerId = dto.providerId;
        user.last_login_at = new Date();
      }

      await this.userRepo.save(user);
      const token = await this.generateToken(user);

      // Make sure this is the exact format expected by frontend
      const response = {
        token,
        slug: user?.slug,
        role: user?.role,
      };

      console.log("OAuth response being sent:", response);
      return response;
    } catch (error) {
      console.error("OAuth error:", error);
      throw error;
    }
  }

  async createUser(createUserDto: RegisterUserDto) {
    try {
      const userExists = await this.CheckUserExists(createUserDto);
      const { email, password, ...rest } = createUserDto;
      const originalPassword = password?.trim();

      if (userExists) {
        throw new HttpException("User already exists", HttpStatus.CONFLICT);
      } else {
        const hashedPassword = await this.bcryptService.hashPassword(
          originalPassword
        );

        const data = {
          email: email?.trim(),
          password: hashedPassword,
          slug: createUserDto.slug?.trim(),
          fullName: createUserDto.fullName?.trim(),
          role: RoleEnum.USER,
          location: createUserDto.location?.trim(),
          contact: createUserDto.contact?.trim(),
          // If you want to make the status to be pending when creating an account, remove the status below
          status: StatusEnum.APPROVED,
        };
        const { password, ...restPart } = await this.userRepo.save(data);

        const token: any = await this.generateToken(restPart);

        return {
          id: restPart.id,
          email: restPart.email,
          role: restPart.role,
          token,
          refreshToken: "",
          slug: restPart.slug,
        };
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async login(loginAuthDto: LoginAuthDto) {
    try {
      const userData = await this.userService.isAuthenticatedUser(loginAuthDto);
      if (userData) {
        if (userData?.status == StatusEnum.APPROVED) {
          const isMatched = await this.bcryptService.comparePassword(
            loginAuthDto?.password?.trim(),
            userData?.password?.trim()
          );
          if (isMatched) {
            const token: any = await this.generateToken(userData);
            return {
              id: userData?.id,
              email: userData?.email,
              role: userData?.role,
              token,
              refreshToken: "",
              slug: userData?.slug,
            };
          } else {
            throw new HttpException(
              "Email or password incorrect",
              HttpStatus.UNAUTHORIZED
            );
          }
        } else {
          throw new HttpException("User not activated", 500);
        }
      } else {
        throw new HttpException("Email not found", 500);
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.userService.isAuthenticatedUser({
        email,
      });

      if (
        user &&
        (await this.bcryptService.comparePassword(password, user.password))
      ) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  // helper functions

  public async generateToken(user: any): Promise<string> {
    return this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        slug: user.slug,
        role: user.role,
      },
      {
        secret: process.env.JWT_SECRET || "secret_key",
        expiresIn: "1d",
      }
    );
  }

  async CheckUserExists(createUserDto) {
    return await this.userRepo.findOne({
      where: {
        email: createUserDto?.email,
      },
    });
  }
}
