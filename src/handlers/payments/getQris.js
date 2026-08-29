const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { SValePay } = require('@starvale-sdk/svalepay');
const config = require('../../database/config.json');

const qrisDinamisWithFee = async (amount, filePath, logger) => {
  if (!amount || Number(amount) <= 0) {
    if (logger) logger.error('Nominal harus lebih dari 0', 'qris');
    throw new Error('Nominal harus lebih dari 0');
  }

  const svalepayConfig = (config && config.svalepay) || (config && config.gomerchant);
  const businessId = svalepayConfig?.business_id || svalepayConfig?.nama_project;
  const secretKey = svalepayConfig?.secret_key || svalepayConfig?.apikey;

  if (!svalepayConfig || !businessId || !secretKey) {
    if (logger) logger.error('Svalepay Business ID atau Secret Key belum dikonfigurasi', 'qris');
    throw new Error('Svalepay Business ID atau Secret Key belum dikonfigurasi');
  }

  const svale = new SValePay({
    businessId,
    secretKey
  });

  const generateReference = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 8; i += 1) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TRX-${token}`;
  };

  const reference = generateReference();

  const response = await svale.createPayment({
    amount: Number(amount),
    payment_method: 'QRIS',
    customer_email: 'customer@svalepay.web.id',
    external_id: reference,
    description: `Payment ${reference}`
  });

  if (!response || response.status !== 'success' || !response.data) {
    const reply = response && (response.message || response.error) ? (response.message || response.error) : JSON.stringify(response || {});
    const errorMessage = `Svalepay payment creation failed: ${reply}`;
    if (logger) logger.error(errorMessage, 'qris');
    throw new Error(errorMessage);
  }

  const paymentData = response.data || {};
  const qrString = paymentData.payment_code || paymentData.qr_string;
  if (!qrString) {
    const errorMessage = 'Svalepay response missing QRIS payment code';
    if (logger) logger.error(`${errorMessage}: ${JSON.stringify(response, null, 2)}`, 'qris');
    throw new Error('Gagal mendapatkan QRIS payment code dari Svalepay');
  }

  const totalAmount = Number(paymentData.amount || amount);
  const originalAmount = Number(amount);
  const fee = Number.isFinite(totalAmount) && Number.isFinite(originalAmount)
    ? Math.max(0, totalAmount - originalAmount)
    : 0;

  const qrDirectory = path.dirname(filePath);
  if (!fs.existsSync(qrDirectory)) fs.mkdirSync(qrDirectory, { recursive: true });

  let qrSaved = false;
  if (typeof svale.generateQr === 'function') {
    try {
      const qrUrl = svale.generateQr({
        code: qrString,
        amount: totalAmount,
        reference: paymentData.trx_id || reference,
        template: 'default',
        theme: 'light',
        uppercase: true
      });

      if (qrUrl) {
        const res = await fetch(qrUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(filePath, buffer);
          qrSaved = true;
        }
      }
    } catch (_) {
      qrSaved = false;
    }
  }

  if (!qrSaved) {
    await QRCode.toFile(filePath, qrString, {
      type: 'png',
      margin: 1,
      width: 512
    });
  }

  return {
    finalAmount: totalAmount,
    randomFee: fee,
    reference: paymentData.trx_id || reference
  };
};

module.exports = {
  qrisDinamisWithFee
};
