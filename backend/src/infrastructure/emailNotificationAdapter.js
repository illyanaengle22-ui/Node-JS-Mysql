const nodemailer = require('nodemailer');
const NotificationPort = require('../domain/notificationPort');

class EmailNotificationAdapter extends NotificationPort {
  constructor() {
    super();
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ ADVERTENCIA: Credenciales SMTP no configuradas. Los correos no se enviarán.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  _generarDesgloseHTML(pedido) {
    let html = `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <thead>
          <tr>
            <th>Vinilo</th>
            <th>Artista</th>
            <th>Cant.</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
    `;
    pedido.items.forEach(item => {
      const sub = Number(item.precioUnitario || item.precio_unitario) * Number(item.cantidad);
      html += `
        <tr>
          <td>${item.nombre}</td>
          <td>${item.artista || '—'}</td>
          <td align="center">${item.cantidad}</td>
          <td align="right">$${Number(item.precioUnitario || item.precio_unitario).toFixed(2)}</td>
          <td align="right">$${sub.toFixed(2)}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
        <tfoot>
          <tr>
            <th colspan="4" align="right">Total:</th>
            <th align="right">$${Number(pedido.total).toFixed(2)}</th>
          </tr>
        </tfoot>
      </table>
    `;
    return html;
  }

  _generarDesgloseTexto(pedido) {
    let txt = `Desglose de items:\n`;
    pedido.items.forEach(item => {
      const sub = Number(item.precioUnitario || item.precio_unitario) * Number(item.cantidad);
      txt += `- ${item.nombre} (${item.artista || '—'}) x ${item.cantidad} = $${sub.toFixed(2)}\n`;
    });
    txt += `\nTotal: $${Number(pedido.total).toFixed(2)}`;
    return txt;
  }

  async enviarInstruccionesPago(pedido, cliente) {
    if (!this.transporter) return;

    const desgloseHTML = this._generarDesgloseHTML(pedido);
    const desgloseTXT = this._generarDesgloseTexto(pedido);
    const fromStr = `"TalkVinyl" <${process.env.SMTP_USER}>`;
    const subject = `Instrucciones de Pago - Pedido #${pedido.id}`;

    const txtMsg = `
Hola ${cliente.nombre},

¡Gracias por tu pedido #${pedido.id} en TalkVinyl!

Estado del pedido: Pendiente de Pago

${desgloseTXT}

Para completar tu compra, por favor realiza una transferencia o depósito a los siguientes datos:
Banco: TalkVinyl Bank
Cuenta: 0123456789
CLABE: 012345678901234567

Finalmente, ingresa a tu sección de "Mis Pedidos" en la plataforma y sube la foto o captura de tu comprobante de pago.
¡Tan pronto lo validemos, procesaremos el envío!
`;

    const htmlMsg = `
<p>Hola <strong>${cliente.nombre}</strong>,</p>
<p>¡Gracias por tu pedido <strong>#${pedido.id}</strong> en TalkVinyl!</p>
<p>Estado del pedido: <span style="color: #d97706; font-weight: bold;">Pendiente de Pago</span></p>
<br>
${desgloseHTML}
<br>
<p>Para completar tu compra, por favor realiza una transferencia o depósito a los siguientes datos:</p>
<ul>
  <li><strong>Banco:</strong> TalkVinyl Bank</li>
  <li><strong>Cuenta:</strong> 0123456789</li>
  <li><strong>CLABE:</strong> 012345678901234567</li>
</ul>
<p>Finalmente, ingresa a tu sección de "Mis Pedidos" en la plataforma y <strong>sube tu comprobante de pago</strong>.</p>
<p>¡Tan pronto lo validemos, procesaremos el envío!</p>
`;

    try {
      await this.transporter.sendMail({
        from: fromStr,
        to: cliente.email,
        subject,
        text: txtMsg,
        html: htmlMsg
      });
      console.log(`[Email] Instrucciones de pago enviadas a ${cliente.email}`);
    } catch (err) {
      console.error(`[Email Error] Fallo al enviar al cliente ${cliente.email}:`, err.message);
    }
  }

  async notificarAdminNuevoPedido(pedido, cliente, correosAdmins) {
    if (!this.transporter) return;
    if (!correosAdmins || correosAdmins.length === 0) {
      if (process.env.ADMIN_EMAIL) correosAdmins = [process.env.ADMIN_EMAIL];
      else {
         console.warn('[Email] No hay administradores registrados para notificar.');
         return;
      }
    }

    const desgloseHTML = this._generarDesgloseHTML(pedido);
    const desgloseTXT = this._generarDesgloseTexto(pedido);
    const fromStr = `"TalkVinyl Sistema" <${process.env.SMTP_USER}>`;
    const subject = `NUEVO PEDIDO PENDIENTE DE PAGO #${pedido.id}`;

    const txtMsg = `
¡Nuevo pedido generado en TalkVinyl!

Pedido #${pedido.id}
Cliente: ${cliente.nombre} (${cliente.email})
Estado: Pendiente de Pago

${desgloseTXT}

El usuario debe enviar su ficha de depósito. Revisa el panel de administrador para validarla.
`;

    const htmlMsg = `
<h2>¡Nuevo pedido generado en TalkVinyl!</h2>
<p><strong>Pedido:</strong> #${pedido.id}</p>
<p><strong>Cliente:</strong> ${cliente.nombre} (<a href="mailto:${cliente.email}">${cliente.email}</a>)</p>
<p><strong>Estado:</strong> Pendiente de Pago</p>
<br>
${desgloseHTML}
<br>
<p>El usuario debe subir su ficha de depósito. Revisa el panel de administrador para validarla cuando sea cargada.</p>
`;

    // Enviar a cada admin sin que falle todo si uno falla
    const promesas = correosAdmins.map(adminEmail => 
      this.transporter.sendMail({
        from: fromStr,
        to: adminEmail,
        subject,
        text: txtMsg,
        html: htmlMsg
      })
    );

    const resultados = await Promise.allSettled(promesas);
    resultados.forEach((res, i) => {
      if (res.status === 'rejected') {
        console.error(`[Email Error] Fallo notificar al admin ${correosAdmins[i]}:`, res.reason.message);
      } else {
        console.log(`[Email] Admin notificado: ${correosAdmins[i]}`);
      }
    });
  }
}

module.exports = EmailNotificationAdapter;
