import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CLAVE_SUPER_SECRETA_DE_LA_POLLERIA', // La misma que usaste en el Module
    });
  }

  async validate(payload: any) {
    // Lo que devuelvas acá se inyectará en el objeto Request (req.user)
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}