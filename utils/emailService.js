const nodemailer = require('nodemailer');
const GeneralSetting = require('../model/generalSetting.model');

/**
 * Email Service để gừi email reports và thông báo
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
    }

    /**
     * Khởi tạo email transporter với cấu hình từ environment variables
     */
    async initializeTransporter() {
        try {
            // Kiểm tra các biến môi trường cần thiết
            const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                console.warn(`[EMAIL SERVICE] Missing environment variables: ${missingVars.join(', ')}`);
                this.isConfigured = false;
                return false;
            }

            // Tạo transporter với cấu hình SMTP
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT),
                secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false // Cho phép self-signed certificates
                }
            });

            // Verify kết nối
            await this.transporter.verify();
            console.log('[EMAIL SERVICE] ✅ Email transporter initialized successfully');
            this.isConfigured = true;
            return true;

        } catch (error) {
            console.error('[EMAIL SERVICE] ❌ Failed to initialize email transporter:', error.message);
            this.isConfigured = false;
            return false;
        }
    }

    /**
     * Lấy thông tin công ty từ database
     */
    async getCompanyInfo() {
        try {
            const settings = await GeneralSetting.findOne({ id: "generalSetting" });
            return {
                name: settings?.companyName || 'Homecare Service',
                email: settings?.companyEmail || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
                address: settings?.companyAddress || '',
                phone: settings?.companyPhone || ''
            };
        } catch (error) {
            console.error('[EMAIL SERVICE] Error getting company info:', error);
            return {
                name: 'Homecare Service',
                email: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
                address: '',
                phone: ''
            };
        }
    }

    /**
     * Tạo HTML template cho report email
     */
    createReportEmailTemplate(reportData, companyInfo) {
        const { 
            detailId, 
            type, 
            description
        } = reportData;

        return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo công việc - ${detailId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .company-info {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3498db;
        }
        .info-section {
            margin-bottom: 25px;
        }
        .info-section h3 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 5px;
        }
        .info-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .report-content {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            line-height: 1.8;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-completed { background-color: #27ae60; }
        .status-pending { background-color: #f39c12; }
        .status-cancelled { background-color: #e74c3c; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 BÁO CÁO CÔNG VIỆC</h1>
            <p>Chi tiết công việc ID: ${detailId}</p>
        </div>

        <div class="info-section">
            <h3>� Thông tin báo cáo</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">ID Chi tiết:</div>
                    <div>${detailId}</div>
                </div>
                ${type ? `<div class="info-item">
                    <div class="info-label">Loại báo cáo:</div>
                    <div>${type}</div>
                </div>` : ''}
            </div>
        </div>

        <div class="info-section">
            <h3>📝 Nội dung báo cáo</h3>
            <div class="report-content">${description || 'Không có mô tả'}</div>
        </div>

        <div class="footer">
            <p>Email này được tạo tự động từ hệ thống ${companyInfo.name}</p>
            <p>Thời gian tạo: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Gửi email report
     */
    async sendReport(reportData) {
        try {
            // Kiểm tra transporter
            if (!this.isConfigured) {
                const initialized = await this.initializeTransporter();
                if (!initialized) {
                    throw new Error('Email service is not configured properly');
                }
            }

            // Lấy thông tin công ty
            const companyInfo = await this.getCompanyInfo();

            // Xác định email người nhận
            const toEmail = process.env.EMAIL_TO_ADDRESS || companyInfo.email;
            if (!toEmail) {
                throw new Error('No recipient email address configured');
            }

            // Tạo HTML content
            const htmlContent = this.createReportEmailTemplate(reportData, companyInfo);

            // Cấu hình email
            const mailOptions = {
                from: {
                    name: companyInfo.name,
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
                },
                to: toEmail,
                subject: `📋 Báo cáo công việc - ${reportData.detailId}`,
                html: htmlContent,
                // Backup text version
                text: `
Báo cáo công việc

Chi tiết ID: ${reportData.detailId}
${reportData.type ? `Loại báo cáo: ${reportData.type}` : ''}

Nội dung báo cáo:
${reportData.description || 'Không có mô tả'}

---
${companyInfo.name}
Thời gian: ${new Date().toLocaleString('vi-VN')}
                `
            };

            // Gửi email
            console.log(`[EMAIL SERVICE] 📤 Sending report email to: ${toEmail}`);
            const result = await this.transporter.sendMail(mailOptions);
            
            console.log(`[EMAIL SERVICE] ✅ Report email sent successfully!`);
            console.log(`[EMAIL SERVICE] Message ID: ${result.messageId}`);
            
            return {
                success: true,
                messageId: result.messageId,
                recipient: toEmail
            };

        } catch (error) {
            console.error('[EMAIL SERVICE] ❌ Failed to send report email:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test email connectivity
     */
    async testConnection() {
        try {
            if (!this.isConfigured) {
                await this.initializeTransporter();
            }
            
            if (this.transporter) {
                await this.transporter.verify();
                return { success: true, message: 'Email connection is working' };
            } else {
                return { success: false, message: 'Email transporter not initialized' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = emailService;