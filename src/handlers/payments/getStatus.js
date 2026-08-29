const { SValePay } = require('@starvale-sdk/svalepay');
const config = require('../../database/config.json');

const checkPayment = async (refId, amount) => {
  if (!refId || !amount || Number(amount) <= 0) {
    return {
      success: false,
      message: 'Reference atau nominal tidak valid'
    };
  }

  const svalepayConfig = (config && config.svalepay) || (config && config.gomerchant);
  const businessId = svalepayConfig?.business_id || svalepayConfig?.nama_project;
  const secretKey = svalepayConfig?.secret_key || svalepayConfig?.apikey;

  if (!svalepayConfig || !businessId || !secretKey) {
    return {
      success: false,
      message: 'Svalepay Business ID atau Secret Key belum dikonfigurasi'
    };
  }

  const svale = new SValePay({
    businessId,
    secretKey
  });

  try {
    const responseData = await svale.getStatus(refId);

    if (!responseData) {
      return {
        success: false,
        message: 'Respons status tidak valid dari Svalepay'
      };
    }

    const paymentStatus = (responseData.data?.status || '').toLowerCase();
    if (responseData.status === 'success' && (paymentStatus === 'success' || paymentStatus === 'paid')) {
      return {
        success: true,
        message: responseData.message || 'Pembayaran sudah diterima',
        data: responseData.data
      };
    }

    return {
      success: false,
      message: responseData.message || responseData.data?.status || 'Pembayaran belum berhasil'
    };
  } catch (err) {
    return {
      success: false,
      message: err && err.message ? err.message : String(err)
    };
  }
};

module.exports = {
  checkPayment
};
