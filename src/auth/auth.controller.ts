import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAuthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "src/core/decorators/response.decorator";
import { LOGGED_IN, REGISTERED, CREATED } from "./auth.constant";

@ApiTags("Auth")
@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/login")
  @UseInterceptors(ClassSerializerInterceptor)
  @ResponseMessage(LOGGED_IN)
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post("/create")
  @ResponseMessage(REGISTERED)
  registerUser(@Req() req: any, @Body() createUserDto: RegisterUserDto) {
    return this.authService.createUser(req.user, createUserDto);
  }
}
