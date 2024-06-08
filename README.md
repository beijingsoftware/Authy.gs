**Authy.gs: Two-Factor Authentication for Google Apps Script**

Authy.gs is a Google Apps Script JavaScript library designed to enhance the security of user accounts stored in Google Sheets by implementing robust two-factor authentication (2FA) mechanisms. It integrates seamlessly with Vault.gs for secure storage of user account details and provides features such as auto-expiring 2FA codes and email code delivery.

### Features
- **Secure User Account Storage**: Utilizes Vault.gs for secure storage of user account information in Google Sheets.
- **Two-Factor Authentication (2FA)**: Enhances account security by requiring users to provide a unique one-time passcode (OTP) in addition to their password during login.
- **Auto-Expiring 2FA Codes**: Automatically generates and expires 2FA codes to minimize the risk of unauthorized access attempts.
- **Email Code Delivery**: Facilitates the delivery of OTPs via email to users for convenient and secure authentication.
- **Customizable Configuration**: Allows customization of parameters such as code expiration duration, email delivery settings, and authentication workflows to align with organizational security policies.

### Usage
To use Authy.gs in your Google Apps Script project, follow these steps:

1. **Installation**: Copy and paste the provided code snippets into your Google Apps Script project.
2. **Dependency**: Ensure that Authy.gs is dependent on Vault.gs for secure data storage.
3. **Initialization**: Run the `AuthyInit` function to initialize the required tables for Authy to function properly.
4. **Integration**: Integrate Authy.gs into your authentication workflow to enable two-factor authentication for user accounts.

### Example Usage
```javascript
// Example usage of Authy.gs
async function main() {
    // Initialize Authy tables
    await AuthyInit()

    await addUser("user@example.com", "password", "name")

    const userId = await getUserId("user@example.com")

    const code = await createTwoFactorCode(userId)
    console.log("Generated 2FA code:", code)
}

// Run the main function
main()
```

### Dependencies
- **Vault.gs**: A Google Apps Script library for secure data storage in Google Sheets.

With Authy.gs, you can easily implement robust two-factor authentication mechanisms to enhance the security of user accounts stored in Google Sheets.
