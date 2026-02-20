import { Controller, Post, Body, Put, Query, UseGuards, Delete, Req, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // Importá estos
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorators';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';

@ApiTags('Auth') // Agrupa este controlador en la sección "Auth"
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private getFrontendConfirmationUrl(status: 'success' | 'error', token?: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmationPath = process.env.FRONTEND_CONFIRM_PATH || '/confirm-account';
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${frontendUrl}${confirmationPath}?status=${status}${tokenParam}`;
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' }) // Descripción de la acción
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El email ya existe.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Si el correo existe, se envía el enlace de recuperación.' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña mediante token' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada correctamente.' })
  @ApiResponse({ status: 403, description: 'Token inválido o expirado.' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  @Post('confirm-email')
  @ApiOperation({ summary: 'Confirmar correo electrónico y completar registro' })
  @ApiResponse({ status: 200, description: 'Correo confirmado y usuario creado.' })
  @ApiResponse({ status: 403, description: 'Token inválido o expirado.' })
  confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    return this.authService.confirmEmail(confirmEmailDto.token);
  }

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirmar correo desde enlace de email y redirigir al frontend' })
  async confirmEmailFromLink(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.redirect(this.getFrontendConfirmationUrl('error'));
    }

    try {
      await this.authService.confirmEmail(token);
      return res.redirect(this.getFrontendConfirmationUrl('success', token));
    } catch {
      return res.redirect(this.getFrontendConfirmationUrl('error', token));
    }
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('update')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El email ya está en uso.' })
  updateUser(
    @Query('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(Number(id), updateUserDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('delete')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 403, description: 'No puedes eliminar tu propio usuario.' })
  deleteUser(
    @Query('id') id: string,
    @Req() req: Request & { user: { userId: number } },
  ) {
    return this.authService.deleteUser(Number(id), req.user.userId);
  }
}