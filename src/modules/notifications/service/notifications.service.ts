import { Injectable } from '@nestjs/common';
import { SendEmailDto } from '../dto/send-email.dto';
import { PrismaService } from '../../../prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    private async getSmtpTransporter() {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error(
                'Faltan variables SMTP_HOST, SMTP_USER o SMTP_PASS en el .env',
            );
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        // Verificar que la conexión SMTP funciona
        try {
            await transporter.verify();
            console.log('[SMTP] Conexión verificada correctamente');
        } catch (verifyError) {
            console.error('[SMTP] Error al verificar conexión:', verifyError);
            throw new Error(`No se pudo conectar al servidor SMTP: ${verifyError.message}`);
        }

        return transporter;
    }

    async sendNewOrderNotificationToAdmins(
        orderId: number,
        clientName: string,
        totalPrice: number,
    ): Promise<{ success: boolean; adminsNotified: number }> {
        try {
            const admins = await this.prisma.users.findMany({
                where: { rol: 'admin' },
                select: { email: true, nombre: true },
            });

            if (!admins.length) {
                throw new Error('No hay administradores registrados');
            }

            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const adminEmails = admins.map((a) => a.email);

            await transporter.sendMail({
                from: mailFrom,
                to: adminEmails.join(', '),
                subject: `🚀 Nuevo pedido #${orderId}`,
                text: `Se ha creado un nuevo pedido #${orderId} del cliente ${clientName} por $${totalPrice.toFixed(2)}`,
                html: `<h2>Nuevo Pedido Recibido</h2><p>Se ha creado un nuevo pedido:</p><ul><li><strong>ID:</strong> #${orderId}</li><li><strong>Cliente:</strong> ${clientName}</li><li><strong>Monto:</strong> $${totalPrice.toFixed(2)}</li></ul><p>Ingresa al sistema para confirmar.</p>`,
            });

            return {
                success: true,
                adminsNotified: admins.length,
            };
        } catch (error) {
            console.error('Error al enviar notificación a admins:', error);
            throw new Error(`Error al notificar admins: ${error.message}`);
        }
    }

    async sendOrderConfirmationToClient(
        orderId: number,
        clientEmail: string,
        clientName: string,
        totalPrice: number,
    ): Promise<{ success: boolean; messageId: string; to: string }> {
        try {
            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const info = await transporter.sendMail({
                from: mailFrom,
                to: clientEmail,
                subject: `Pedido #${orderId} - Estado: Pendiente - Granja 3 Hermanos`,
                text: `Hola ${clientName}, tu pedido #${orderId} fue recibido correctamente por un total de $${totalPrice.toFixed(2)}. Estado actual: PENDIENTE. Te avisaremos cuando cambie de estado. ¡Gracias por tu compra!`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #c62828;">¡Pedido recibido!</h2>
                        <p>Hola <strong>${clientName}</strong>,</p>
                        <p>Tu pedido fue registrado exitosamente:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr style="background: #f5f5f5;">
                                <td style="padding: 8px; font-weight: bold;">Pedido #</td>
                                <td style="padding: 8px;">${orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Total</td>
                                <td style="padding: 8px;">$${totalPrice.toFixed(2)}</td>
                            </tr>
                            <tr style="background: #fff3e0;">
                                <td style="padding: 8px; font-weight: bold;">Estado</td>
                                <td style="padding: 8px;"><strong style="color: #e65100;">⏳ Pendiente</strong></td>
                            </tr>
                        </table>
                        <p>Tu pedido está <strong>pendiente de confirmación</strong>. Te enviaremos un email cada vez que el estado cambie.</p>
                        <p style="color: #666; font-size: 14px;">¡Gracias por elegirnos! 🐔</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Granja 3 Hermanos</p>
                    </div>
                `,
            });

            return {
                success: true,
                messageId: info.messageId,
                to: clientEmail,
            };
        } catch (error) {
            console.error('Error al enviar confirmación al cliente:', error);
            throw new Error(`Error al enviar confirmación: ${error.message}`);
        }
    }

    async sendOrderStatusEmail(
        data: SendEmailDto,
    ): Promise<{ success: boolean; messageId: string; to: string }> {
        try {
            const estadosMensajes: Record<string, string> = {
                'pendiente': 'está pendiente de confirmación',
                'pagado': 'fue marcado como pagado. ¡Gracias por tu pago!',
                'preparando': 'está siendo preparado',
                'en_proceso': 'está siendo preparado',
                'listo': 'está listo para retirar',
                'en_camino': 'está en camino a tu domicilio',
                'completado': 'fue completado exitosamente',
                'entregado': 'ha sido entregado',
                'cancelado': 'ha sido cancelado',
            };

            const estadoColores: Record<string, string> = {
                'pendiente': '#e65100',
                'pagado': '#2e7d32',
                'preparando': '#1565c0',
                'en_proceso': '#1565c0',
                'listo': '#6a1b9a',
                'en_camino': '#00838f',
                'completado': '#2e7d32',
                'entregado': '#2e7d32',
                'cancelado': '#c62828',
            };

            const estadoIconos: Record<string, string> = {
                'pendiente': '⏳',
                'pagado': '💰',
                'preparando': '👨‍🍳',
                'en_proceso': '👨‍🍳',
                'listo': '✅',
                'en_camino': '🚚',
                'completado': '🎉',
                'entregado': '📦',
                'cancelado': '❌',
            };

            const mensajeEstado = estadosMensajes[data.estado] || `cambió a estado: ${data.estado}`;
            const colorEstado = estadoColores[data.estado] || '#333';
            const iconoEstado = estadoIconos[data.estado] || '📋';
            const estadoLabel = data.estado.charAt(0).toUpperCase() + data.estado.slice(1).replace('_', ' ');
            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const info = await transporter.sendMail({
                from: mailFrom,
                to: data.email,
                subject: `Pedido #${data.order_id} - Estado: ${estadoLabel} - Granja 3 Hermanos`,
                text: `Hola ${data.nombre}, tu pedido #${data.order_id} ${mensajeEstado}. Estado actual: ${estadoLabel}. Gracias por tu compra.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #c62828;">Actualización de tu pedido</h2>
                        <p>Hola <strong>${data.nombre}</strong>,</p>
                        <p>Tu pedido <strong>#${data.order_id}</strong> ${mensajeEstado}.</p>
                        <div style="background: #f5f5f5; border-left: 4px solid ${colorEstado}; padding: 16px; margin: 16px 0; border-radius: 4px;">
                            <p style="margin: 0; font-size: 18px;"><strong>${iconoEstado} Estado actual: <span style="color: ${colorEstado};">${estadoLabel}</span></strong></p>
                        </div>
                        <p>¡Gracias por tu compra!</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Granja 3 Hermanos</p>
                    </div>
                `,
            });

            return {
                success: true,
                messageId: info.messageId,
                to: data.email,
            };
        } catch (error) {
            console.error('Error al enviar notificación por email:', error);
            throw new Error(`Error al generar notificación: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(
        to: string,
        nombre: string,
        resetUrl: string,
    ): Promise<{ success: boolean; messageId: string; to: string }> {
        try {
            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const info = await transporter.sendMail({
                from: mailFrom,
                to,
                subject: 'Recuperación de contraseña',
                text: `Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña. Usa este enlace (válido por 15 minutos): ${resetUrl}`,
                html: `<p>Hola <strong>${nombre}</strong>,</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p>Este enlace es válido por <strong>15 minutos</strong>:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no solicitaste este cambio, ignora este correo.</p>`,
            });

            return {
                success: true,
                messageId: info.messageId,
                to,
            };
        } catch (error) {
            console.error('Error al enviar email de recuperación:', error);
            throw new Error(`Error al enviar email de recuperación: ${error.message}`);
        }
    }

    async sendEmailConfirmationEmail(
        to: string,
        nombre: string,
        confirmationUrl: string,
    ): Promise<{ success: boolean; messageId: string; to: string }> {
        try {
            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const info = await transporter.sendMail({
                from: mailFrom,
                to,
                subject: 'Confirma tu correo electrónico',
                text: `Hola ${nombre}, Gracias por registrarte. Confirma tu correo con este enlace: ${confirmationUrl}`,
                html: `<p>Hola <strong>${nombre}</strong>,</p><p>Gracias por registrarte.</p><p>Confirma tu correo haciendo clic aquí:</p><p><a href="${confirmationUrl}">${confirmationUrl}</a></p>`,
            });

            return {
                success: true,
                messageId: info.messageId,
                to,
            };
        } catch (error) {
            console.error('Error al enviar email de confirmación:', error);
            throw new Error(`Error al enviar email de confirmación: ${error.message}`);
        }
    }
}
