import QRCode from 'qrcode/lib/browser';

export const generateQRCode = async (text) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR Code generation error:', err);
    throw err;
  }
};

