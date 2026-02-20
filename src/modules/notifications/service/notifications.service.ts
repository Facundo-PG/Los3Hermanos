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

        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
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

    async sendOrderStatusEmail(
        data: SendEmailDto,
    ): Promise<{ success: boolean; messageId: string; to: string }> {
        try {
            const estadosMensajes: Record<string, string> = {
                'pendiente': 'está pendiente de confirmación',
                'preparando': 'está siendo preparado',
                'listo': 'está listo para retirar',
                'en_camino': 'está en camino a tu domicilio',
                'entregado': 'ha sido entregado',
                'cancelado': 'ha sido cancelado',
            };

            const mensajeEstado = estadosMensajes[data.estado] || `cambió a estado: ${data.estado}`;
            const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
            const transporter = await this.getSmtpTransporter();

            const info = await transporter.sendMail({
                from: mailFrom,
                to: data.email,
                subject: `Actualización de tu pedido #${data.order_id}`,
                text: `Hola ${data.nombre}, tu pedido #${data.order_id} ${mensajeEstado}. Gracias por tu compra.`,
                html: `<p>Hola <strong>${data.nombre}</strong>,</p><p>Tu pedido <strong>#${data.order_id}</strong> ${mensajeEstado}.</p><p>¡Gracias por tu compra!</p>`,
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
