const { pool } = require('../../config/db');

exports.getSecurityDashboard = async (req, res, next) => {
  try {
    // We mock the exact data from image2.png to ensure UI matches Figma perfectly

    // 1. Role Permission Matrix
    const permissions = [
      {
        module: 'Leave Management',
        admin: ['view', 'add', 'edit', 'delete', 'approve'],
        hr: ['view', 'add', 'edit', 'delete'],
        manager: ['view', 'add', 'approve'],
        employee: ['view', 'add'],
        accounts: []
      },
      {
        module: 'Salary Generation',
        admin: ['view', 'add', 'edit', 'delete', 'approve'],
        hr: ['view', 'add', 'edit'],
        manager: [],
        employee: ['view'],
        accounts: ['view', 'add', 'edit', 'delete', 'approve']
      },
      {
        module: 'Employee',
        admin: ['view', 'add', 'edit', 'delete', 'approve'],
        hr: ['view', 'add', 'edit', 'delete'],
        manager: ['view'],
        employee: ['view'],
        accounts: ['view', 'edit']
      },
      {
        module: 'Setting',
        admin: ['view', 'add', 'edit', 'delete', 'approve'],
        hr: ['view'],
        manager: [],
        employee: [],
        accounts: []
      }
    ];

    // 2. User Accounts
    const users = [
      { id: 1, name: 'Aviram Singha', role: 'HR', email: 'aviram@company.com', status: 'Active', avatar: 'AS', isNew: true },
      { id: 2, name: 'Rahul Saha', role: 'Manager', email: 'rahul@company.com', status: 'Active', avatar: 'RS', isNew: false },
      { id: 3, name: 'Abdullah Al Sayeed', role: 'Employee', email: 'abdullah@company.com', status: 'Disabled', avatar: 'AS', isNew: false }
    ];

    // 3. Policy & Protection
    const policy = {
      minPasswordLength: '10 characters',
      idleTimeout: '15 minutes',
      passwordReset: 'Email / OTP',
      mfa: 'Optional'
    };

    const protection = {
      encryptionAtRest: 'AES-256',
      encryptionInTransit: 'TLS 1.2+',
      sso: 'SAML / Google SSO',
      dataRetention: 'Configurable per record type'
    };

    // 4. Audit Log
    const auditLogs = [
      { id: 1, date: 'Sep 10', time: '10:42 AM', action: 'Nadia Chowdhury approved leave request for Aviram Singha' },
      { id: 2, date: 'Sep 10', time: '09:15 AM', action: 'Rahul Saha edited NBR tax slab table' },
      { id: 3, date: 'Sep 9', time: '05:03 PM', action: 'Admin deactivated user account Abdullah Al Sayeed' }
    ];

    res.json({
      status: 'success',
      data: {
        permissions,
        users,
        policy,
        protection,
        auditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};
