
import { SystemSettings, User, CommConfig, LogEntry } from '../types';
import { LogService, SettingsService, UserService } from './mockService';

export const CommunicationService = {
  /**
   * Dispatches a notification to external channels based on configuration
   */
  dispatch: async (title: string, message: string, recipientId?: string) => {
    const settings = await SettingsService.get();
    const recipient = recipientId ? (await UserService.getAll()).find(u => u.id === recipientId) : null;

    const results = [];

    // 1. Email Delivery
    if (settings.emailIntegration?.enabled && recipient?.email) {
      results.push(CommunicationService.sendEmail(settings.emailIntegration, recipient.email, title, message));
    }

    // 2. SMS Delivery
    if (settings.smsIntegration?.enabled && recipient?.phone) {
      results.push(CommunicationService.sendSMS(settings.smsIntegration, recipient.phone, message));
    }

    return Promise.all(results);
  },

  sendEmail: async (config: CommConfig, to: string, subject: string, body: string) => {
    try {
      // Simulation of a fetch call to an SMTP or Email API proxy
      console.log(`[COMM] Sending Email via ${config.type} to ${to}: ${subject}`);
      
      // In a real app: 
      // await fetch('/api/comm/email', { method: 'POST', body: JSON.stringify({ config, to, subject, body }) });

      await LogService.add({
        action: 'Email Dispatched',
        category: 'COMMUNICATION',
        details: `Successfully sent email to ${to} using ${config.type}.`,
        actor: 'System'
      });
      return { channel: 'EMAIL', status: 'SENT' };
    } catch (error) {
      await LogService.add({
        action: 'Email Failed',
        category: 'COMMUNICATION',
        details: `Failed to send email to ${to}: ${error}`,
        actor: 'System'
      });
      return { channel: 'EMAIL', status: 'FAILED' };
    }
  },

  sendSMS: async (config: CommConfig, to: string, body: string) => {
    try {
      console.log(`[COMM] Sending SMS via ${config.type} to ${to}: ${body.substring(0, 20)}...`);
      
      // Simulation
      // await fetch('/api/comm/sms', { method: 'POST', body: JSON.stringify({ config, to, body }) });

      await LogService.add({
        action: 'SMS Dispatched',
        category: 'COMMUNICATION',
        details: `Successfully sent SMS to ${to} via ${config.senderId}.`,
        actor: 'System'
      });
      return { channel: 'SMS', status: 'SENT' };
    } catch (error) {
      await LogService.add({
        action: 'SMS Failed',
        category: 'COMMUNICATION',
        details: `Failed to send SMS to ${to}: ${error}`,
        actor: 'System'
      });
      return { channel: 'SMS', status: 'FAILED' };
    }
  },

  testConnection: async (config: CommConfig, type: 'EMAIL' | 'SMS'): Promise<boolean> => {
    // Simulated connection test
    return new Promise((resolve) => {
      setTimeout(() => resolve(!!config.enabled), 1000);
    });
  }
};
