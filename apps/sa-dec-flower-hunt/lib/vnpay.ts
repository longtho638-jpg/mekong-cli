import crypto from 'crypto';
import querystring from 'querystring';

/**
 * VNPay Payment Gateway Integration
 * Based on VNPay API Specification v2.1.0
 */

// VNPay Configuration (from environment variables)
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || ''; // Merchant Code
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || ''; // Secret key
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_RETURN_URL = process.env.NEXT_PUBLIC_APP_URL + '/api/payment/callback';

export interface VNPayPaymentParams {
    orderId: string;
    amount: number; // VNĐ (no decimals)
    orderDescription: string;
    bankCode?: string; // Optional: specific bank
    ipAddress: string;
    locale?: 'vn' | 'en'; // Default: 'vn'
}

export interface VNPayCallbackParams {
    vnp_Amount: string;
    vnp_BankCode: string;
    vnp_BankTranNo: string;
    vnp_CardType: string;
    vnp_OrderInfo: string;
    vnp_PayDate: string;
    vnp_ResponseCode: string;
    vnp_TmnCode: string;
    vnp_TransactionNo: string;
    vnp_TransactionStatus: string;
    vnp_TxnRef: string;
    vnp_SecureHash?: string;
    vnp_SecureHashType?: string;
    [key: string]: string | undefined;
}

/**
 * Generate VNPay payment URL
 */
export function createPaymentUrl(params: VNPayPaymentParams): string {
    const createDate = formatDate(new Date());
    const expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes

    const vnpParams: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_Amount: (params.amount * 100).toString(), // VNPay requires amount in cents (x100)
        vnp_CreateDate: createDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: params.ipAddress,
        vnp_Locale: params.locale || 'vn',
        vnp_OrderInfo: params.orderDescription,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_TxnRef: params.orderId,
        vnp_ExpireDate: expireDate,
    };

    if (params.bankCode) {
        vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sort params alphabetically (VNPay requirement)
    const sortedParams = sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(sortedParams);
    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature to params
    sortedParams.vnp_SecureHash = signed;

    // Build final URL
    const paymentUrl = VNPAY_URL + '?' + querystring.stringify(sortedParams);

    return paymentUrl;
}

/**
 * Verify VNPay callback signature
 */
export function verifyCallback(params: VNPayCallbackParams): boolean {
    const secureHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // Sort params
    const sortedParams = sortObject(params);
    const signData = querystring.stringify(sortedParams);

    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
}

/**
 * Check if transaction was successful
 */
export function isSuccessTransaction(responseCode: string): boolean {
    return responseCode === '00';
}

/**
 * Get response message by code
 */
export function getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
        '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    };

    return messages[code] || 'Lỗi không xác định';
}

// Helper functions
function sortObject(obj: Record<string, string | undefined>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
            sorted[key] = value;
        }
    });
    return sorted;
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Example usage:
 * 
 * // Create payment
 * const paymentUrl = createPaymentUrl({
 *   orderId: 'ORDER123',
 *   amount: 100000, // 100,000 VNĐ
 *   orderDescription: 'Thanh toán đơn hàng #ORDER123',
 *   ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
 * });
 * 
 * // Verify callback
 * const isValid = verifyCallback(req.query as VNPayCallbackParams);
 * const isSuccess = isSuccessTransaction(req.query.vnp_ResponseCode);
 */
