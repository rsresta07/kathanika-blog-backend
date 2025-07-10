import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginAuthDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "test@gmail.com" })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "@password123" })
  password: string;
}

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "chaaku" })
  slug: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "Rameshwor Shrestha" })
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: "test@gmail.com" })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "@password123" })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "9876543210" })
  contact: string;

  @IsOptional()
  @ApiProperty({ example: "APPROVED" })
  status: any;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "koteshwor" })
  location: string;
}

export class OauthDto {
  @IsString()
  provider: "google" | "facebook";

  @IsString()
  providerId: string; // account.providerAccountId

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
