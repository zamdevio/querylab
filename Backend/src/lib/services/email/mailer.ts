/**
 * Resend Email Service
 * Simple email sending via Resend API
 */

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	from?: string;
}

export interface ResendConfig {
	apiKey: string;
	defaultFrom: string;
	frontendUrl?: string; // Frontend URL for links (optional, defaults to querylab.zamdev.dev)
}

/**
 * Mailer service class using Resend
 */
export class MailerService {
	private apiKey: string;
	private defaultFrom: string;
	private frontendUrl: string;

	constructor(config: ResendConfig) {
		this.apiKey = config.apiKey;
		this.defaultFrom = config.defaultFrom;
		this.frontendUrl = config.frontendUrl || '';
	}

	/**
	 * Check if mailer is configured
	 */
	isConfigured(): boolean {
		return !!this.apiKey;
	}

	/**
	 * Send email via Resend API
	 * @param options - Email options
	 * @returns Result with success status
	 */
	async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
		if (!this.apiKey) {
			const errorMsg = 'Resend API key not configured';
			return {
				success: false,
				error: errorMsg,
			};
		}

		const emailDetails = {
			to: options.to,
			subject: options.subject,
			from: options.from || this.defaultFrom,
		};

		try {
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: emailDetails.from,
					to: options.to,
					subject: options.subject,
					html: options.html,
					text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text
				}),
			});

			const responseData = await response.json() as { id?: string; message?: string; error?: { message?: string } };

			if (!response.ok) {
				console.error('[MAILER ERROR] Resend API error:', {
					status: response.status,
					statusText: response.statusText,
					error: responseData,
					emailDetails,
					timestamp: new Date().toISOString(),
				});

				return {
					success: false,
					error: `Email API error: ${responseData.message || responseData.error?.message || response.statusText}`,
				};
			}

			return { success: true };
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;

			console.error('[MAILER ERROR] Failed to send email:', {
				error: errorMsg,
				stack: errorStack,
				emailDetails,
				timestamp: new Date().toISOString(),
			});

			return {
				success: false,
				error: `Failed to send email: ${errorMsg}`,
			};
		}
	}

	/**
	 * Send verification email with code
	 * @param email - Recipient email
	 * @param code - 6-digit verification code
	 * @returns Result with success status
	 */
	async sendVerificationEmail(
		email: string,
		code: string,
	): Promise<{ success: boolean; error?: string }> {
		// Embed favicon as data URI (from Backend/public/favicon.svg)
		// This makes the email self-contained and doesn't rely on external URLs
		const faviconDataUri = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#grad)"/>
  <text x="50" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">Q</text>
  <path d="M 20 20 L 35 20 L 35 35 L 20 35 Z" fill="white" opacity="0.3"/>
  <path d="M 65 20 L 80 20 L 80 35 L 65 35 Z" fill="white" opacity="0.3"/>
  <path d="M 20 65 L 35 65 L 35 80 L 20 80 Z" fill="white" opacity="0.3"/>
  <path d="M 65 65 L 80 65 L 80 80 L 65 80 Z" fill="white" opacity="0.3"/>
</svg>`);
		
		const html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">
				<title>Login to QueryLab - Your SQL Learning Platform</title>
				<link rel="icon" href="${faviconDataUri}" type="image/svg+xml">
			</head>
			<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); line-height: 1.6;">
				<table role="presentation" style="width: 100%; border-collapse: collapse; padding: 40px 20px; min-height: 100vh;">
					<tr>
						<td align="center" style="padding: 20px 0;">
							<table role="presentation" style="width: 100%; max-width: 640px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;">
								<!-- Header with Logo -->
								<tr>
									<td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center; position: relative;">
										<div style="margin-bottom: 16px;">
											<img src="${faviconDataUri}" alt="QueryLab" style="width: 64px; height: 64px; display: inline-block; background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 12px;">
										</div>
										<h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">QueryLab</h1>
										<p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 400;">Zero-install PostgreSQL Learning Platform</p>
									</td>
								</tr>
								
								<!-- Welcome Section -->
								<tr>
									<td style="padding: 48px 40px 32px 40px; background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);">
										<h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 28px; font-weight: 700;">Welcome to QueryLab!</h2>
										<p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
											QueryLab is your in-browser PostgreSQL learning platform. Learn SQL with AI assistance, practice queries, and explore databases - all without any installation required.
										</p>
										
										<!-- Features List -->
										<div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #667eea;">
											<p style="margin: 0 0 12px 0; color: #2d3748; font-size: 15px; font-weight: 600;">✨ What you can do with QueryLab:</p>
											<ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
												<li>Write and execute SQL queries in a beautiful Monaco editor</li>
												<li>Generate SQL from natural language using AI</li>
												<li>Fix SQL errors automatically with AI assistance</li>
												<li>Import/export databases and explore schemas</li>
												<li>All data stays in your browser - completely private</li>
											</ul>
										</div>
									</td>
								</tr>
								
								<!-- Verification Code Section -->
								<tr>
									<td style="padding: 0 40px 40px 40px;">
										<div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 32px; text-align: center;">
											<p style="margin: 0 0 20px 0; color: #2d3748; font-size: 16px; font-weight: 600;">Your Login Verification Code</p>
											<div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea; border-radius: 16px; padding: 32px 24px; display: inline-block; min-width: 300px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);">
												<div style="font-size: 48px; font-weight: 700; color: #667eea; letter-spacing: 16px; font-family: 'Courier New', 'Monaco', monospace; line-height: 1.2; text-align: center;">
													${code}
												</div>
											</div>
											<p style="margin: 24px 0 0 0; color: #718096; font-size: 14px; line-height: 1.5;">
												Enter this code in the login window to access QueryLab and start learning SQL.
											</p>
											<p style="margin: 8px 0 0 0; color: #a0aec0; font-size: 13px;">
												⏱️ Code expires in 24 hours
											</p>
										</div>
									</td>
								</tr>
								
								<!-- Security Notice -->
								<tr>
									<td style="padding: 0 40px 32px 40px;">
										<div style="background: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; padding: 16px 20px;">
											<p style="margin: 0; color: #742a2a; font-size: 13px; line-height: 1.5;">
												<strong style="color: #c53030;">🔒 Security Notice:</strong> If you didn't request this verification code, please ignore this email. Your account remains secure.
											</p>
										</div>
									</td>
								</tr>
								
								<!-- Footer -->
								<tr>
									<td style="padding: 32px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center;">
										<p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; line-height: 1.5;">
											<a href="${this.frontendUrl}" style="color: #667eea; text-decoration: none; font-weight: 600;">Visit QueryLab</a> to start learning SQL
										</p>
										<p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
											This is an automated email from QueryLab. Please do not reply to this message.
										</p>
										<p style="margin: 12px 0 0 0; color: #cbd5e0; font-size: 11px;">
											© ${new Date().getFullYear()} QueryLab. All rights reserved.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`;

		const text = `
Welcome to QueryLab - Your SQL Learning Platform

QueryLab is your in-browser PostgreSQL learning platform. Learn SQL with AI assistance, practice queries, and explore databases - all without any installation required.

✨ What you can do with QueryLab:
• Write and execute SQL queries in a beautiful Monaco editor
• Generate SQL from natural language using AI
• Fix SQL errors automatically with AI assistance
• Import/export databases and explore schemas
• All data stays in your browser - completely private

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your Login Verification Code: ${code}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter this code in the login window to access QueryLab and start learning SQL.

⏱️ This code will expire in 24 hours for security purposes.

🔒 Security Notice: If you didn't request this verification code, please ignore this email. Your account remains secure.

Visit ${this.frontendUrl} to start learning SQL

This is an automated email from QueryLab. Please do not reply to this message.

© ${new Date().getFullYear()} QueryLab. All rights reserved.
		`;

		const result = await this.sendEmail({
			to: email,
			subject: 'Your Login Code - QueryLab',
			html,
			text,
		});

		if (!result.success) {
			console.error('[MAILER ERROR] Verification email failed to send:', {
				to: email,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
		}

		return result;
	}
}

/**
 * Create a mailer service instance
 * @param config - Resend configuration with API key and default from address
 * @returns Mailer service instance
 */
export function createMailerService(config: ResendConfig): MailerService {
	return new MailerService(config);
}
