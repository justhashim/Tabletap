import QRCode from 'qrcode';
import { cloudinary } from '../config/cloudinary.js';

export interface QRResult {
    dataUrl: string;    // base64 PNG data URL (for inline preview)
    cloudinaryUrl: string; // hosted URL (persistent)
}

/**
 * Generate a QR code PNG for a table and upload it to Cloudinary.
 * Returns both a local data-URL and the Cloudinary-hosted URL.
 */
export async function generateTableQR(
    restaurantId: string,
    tableNumber: string,
    appBaseUrl: string = process.env.FRONTEND_URL ?? 'https://tabletap.com'
): Promise<QRResult> {
    const url = `${appBaseUrl}/r/${restaurantId}/table/${tableNumber}`;

    // Generate base64 PNG
    const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        width: 512,
    });

    // Upload to Cloudinary (if credentials are present)
    let cloudinaryUrl = dataUrl; // fallback to data URL when Cloudinary is not configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(dataUrl, {
            folder: `tabletap/qr/${restaurantId}`,
            public_id: `table-${tableNumber}`,
            overwrite: true,
            resource_type: 'image',
        });
        cloudinaryUrl = result.secure_url;
    }

    return { dataUrl, cloudinaryUrl };
}
