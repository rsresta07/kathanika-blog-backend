import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginAuthDto, OauthDto, RegisterUserDto } from "./dto/create-auth.dto";
import { ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "src/core/decorators/response.decorator";
import { LOGGED_IN, REGISTERED, CREATED } from "./auth.constant";

@ApiTags("Auth")
@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("/oauth")
  @ResponseMessage(LOGGED_IN) // reuse your decorator
  async oauth(@Body() dto: OauthDto) {
    return this.authService.handleOauth(dto);
  }
}
