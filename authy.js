const DB_KEY = ""
const ENCRYPTION_SEED = ""

async function AuthyInit() {
    try {
        const actions = [
            { action: "create", type: "table", table: "Users" },
            {
                action: "create",
                type: "column",
                table: "Users",
                column: "email",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "Users",
                column: "passwordHash",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "Users",
                column: "name",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "Users",
                column: "dateCreated",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "Users",
                column: "twoFactorAuth",
                dataType: "boolean",
                required: true,
            },
            { action: "create", type: "table", table: "2FACodes" },
            {
                action: "create",
                type: "column",
                table: "2FACodes",
                column: "userId",
                dataType: "integer",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "2FACodes",
                column: "code",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "2FACodes",
                column: "expiration",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "2FACodes",
                column: "triggerId",
                dataType: "string",
                required: true,
            },
            { action: "create", type: "table", table: "emailVerification" },
            {
                action: "create",
                type: "column",
                table: "emailVerification",
                column: "email",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "emailVerification",
                column: "code",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "emailVerification",
                column: "expiration",
                dataType: "string",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "emailVerification",
                column: "triggerId",
                dataType: "string",
                required: true,
            },
        ]

        await Promise.all(
            actions.map(async (action) => {
                action.key = DB_KEY
                return VaultGS.evaluate(action)
            })
        )

        console.log("Database initialized successfully")
    } catch (error) {
        console.error("Error initializing database:", error)
    }
}

async function getUserFromEmail(email) {
    try {
        const userId = await getUserId(email)
        const user = await getUser(userId)
        return user
    } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

function getUser(userId) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "entry",
            table: "Users",
            id: userId,
        })
        return result.data
    } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

async function getUserId(email) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "column",
            table: "Users",
            column: "email",
        })

        const index = result.data.findIndex((e) => e.toLowerCase() === email.toLowerCase()) + 1

        if (index >= 1) {
            return index
        } else {
            throw new Error("User not found")
        }
    } catch (error) {
        throw new Error(`Failed to fetch user ID: ${error.message}`)
    }
}

async function isValidUser(email) {
    try {
        await getUserId(email)
        return true
    } catch (error) {
        return false
    }
}

async function addUser(email, password, name) {
    try {
        if (await getUserFromEmail(email).catch(() => {})) {
            throw new Error("User already exists")
        }

        const result = await VaultGS.evaluate({
            key: DB_KEY,
            action: "create",
            type: "Entry",
            table: "Users",
            entry: {
                email: email.toLowerCase(),
                passwordHash: hash(password),
                dateCreated: new Date().toLocaleString("en-US", { timeZone: TIMEZONE }),
                twoFactorAuth: true,
                name: name,
            },
        })

        return { message: "Successfully added user", result: result }
    } catch (error) {
        throw new Error(`Failed to add user: ${error.message}`)
    }
}

async function removeUser(email) {
    try {
        const userId = await getUserId(email)
        await VaultGS.evaluate({
            key: DB_KEY,
            action: "delete",
            type: "entry",
            table: "Users",
            id: userId,
        })
        return { message: "Successfully removed user" }
    } catch (error) {
        throw new Error(`Failed to remove user: ${error.message}`)
    }
}

async function validateCredentials(email, password) {
    try {
        const userId = await getUserId(email)
        const result = await VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "entry",
            table: "Users",
            id: userId,
        })

        const storedPasswordHash = result.data.passwordHash
        const inputPasswordHash = hash(password)

        if (storedPasswordHash === inputPasswordHash) {
            return { message: "Password Verified" }
        } else {
            throw new Error("Incorrect Password")
        }
    } catch (error) {
        throw error
    }
}

async function changePassword(email, newPassword) {
    try {
        const userId = await getUserId(email)
        await VaultGS.evaluate({
            key: DB_KEY,
            action: "update",
            type: "entry",
            table: "Users",
            id: userId,
            entry: { passwordHash: hash(newPassword) },
        })
        return { message: "Changed Password successfully" }
    } catch (error) {
        throw new Error(`Failed to change password: ${error.message}`)
    }
}

async function changeEmail(email, newEmail) {
    try {
        const userId = await getUserId(email)
        const result = await VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "entry",
            table: "Users",
            id: userId,
        })

        await VaultGS.evaluate({
            key: DB_KEY,
            action: "delete",
            type: "entry",
            table: "Users",
            id: userId,
        })

        addUser(newEmail, result.data.passwordHash)
        return { message: "Successfully changed email" }
    } catch (error) {
        throw new Error(`Failed to change email: ${error.message}`)
    }
}

async function changeTwoFactorAuth(email, required) {
    try {
        const userId = await getUserId(email)
        await VaultGS.evaluate({
            key: DB_KEY,
            action: "update",
            type: "entry",
            table: "Users",
            id: userId,
            entry: { twoFactorAuth: required },
        })
        return { message: "Two-factor authentication status changed successfully" }
    } catch (error) {
        throw new Error(`Failed to change two-factor: ${error.message}`)
    }
}

async function changeName(email, newName) {
    try {
        const userId = await getUserId(email)
        await VaultGS.evaluate({
            key: DB_KEY,
            action: "update",
            type: "entry",
            table: "Users",
            id: userId,
            entry: { name: newName },
        })
        return { message: "Name changed successfully" }
    } catch (error) {
        throw new Error(`Failed to change name: ${error.message}`)
    }
}

function hash(data) {
    return Utilities.base64Encode(
        Utilities.computeHmacSha256Signature(data, ENCRYPTION_SEED)
    )
}

function generateCode(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return Array.from(
        { length },
        () => characters[Math.floor(Math.random() * characters.length)]
    ).join("")
}

async function getTwoFactorCodeEntries() {
    try {
        const result = await VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "table",
            table: "2FACodes",
        })
        return result.data ? result.data : []
    } catch (error) {
        throw new Error(`Failed to fetch two-factor code entries: ${error.message}`)
    }
}

async function getTwoFactorCodeEntry(userId) {
    try {
        const codes = await getTwoFactorCodeEntries()
        const codeEntry = codes.find((c) => c.userId === userId)
        if (codeEntry) {
            return codeEntry
        } else {
            throw new Error("No code found for user")
        }
    } catch (error) {
        throw new Error(`Failed to fetch two-factor code entry: ${error.message}`)
    }
}

async function getTwoFactorCodeByTriggerId(triggerId) {
    try {
        const codes = await getTwoFactorCodeEntries()
        const codeEntry = codes.find((c) => c.triggerId == triggerId)
        if (codeEntry) {
            return codeEntry
        } else {
            throw new Error(`No code found for trigger: ${triggerId}`)
        }
    } catch (error) {
        throw new Error(`Failed to fetch two-factor code by trigger ID: ${error.message}`)
    }
}

async function createTwoFactorCode(userId) {
    try {
        // Check if there's already an existing code for the user
        const existingCode = await getTwoFactorCodeEntry(userId).catch(() => null)
        if (existingCode) {
            return existingCode.code
        }

        // If no existing code, generate a new one
        const code = generateCode(10)
        const expirationTime = new Date()
        expirationTime.setMinutes(expirationTime.getMinutes() + EXPIRATION_TIME)

        const trigger = ScriptApp.newTrigger("expireTwoFactorCode")
            .timeBased()
            .at(expirationTime)
            .create()
        const triggerId = trigger.getUniqueId()

        await VaultGS.evaluate({
            key: DB_KEY,
            action: "create",
            type: "entry",
            table: "2FACodes",
            entry: {
                userId: userId,
                code: code,
                expiration: expirationTime.toLocaleString("en-US", { timeZone: TIMEZONE }),
                triggerId: triggerId,
            },
        })

        return code
    } catch (error) {
        throw new Error(`Failed to create two-factor code: ${error.message}`)
    }
}

async function expireTwoFactorCode(e) {
    try {
        const triggerId = e.triggerUid
        const codeEntry = await getTwoFactorCodeByTriggerId(triggerId)

        // Delete trigger
        ScriptApp.getProjectTriggers().forEach((trigger) => {
            if (trigger.getUniqueId() == triggerId) {
                ScriptApp.deleteTrigger(trigger)
            }
        })

        // Delete code entry from database
        await VaultGS.evaluate({
            key: DB_KEY,
            action: "delete",
            type: "entry",
            table: "2FACodes",
            id: codeEntry.id,
        })

        return { message: "Two-factor code expired successfully." }
    } catch (error) {
        throw new Error(`Failed to expire two-factor code: ${error.message}`)
    }
}

async function validateTwoFactorCode(email, code) {
    try {
        const userId = await getUserId(email)
        const codeEntry = await getTwoFactorCodeEntry(userId)

        if (code === codeEntry.code) {
            return true // Code is valid
        } else {
            return false // Code is invalid
        }
    } catch (error) {
        throw new Error(`Failed to validate two-factor code: ${error.message}`)
    }
}

async function emailTwoFactorCode(email) {
    const userId = await getUserId(email)
    const code = await createTwoFactorCode(userId)
    const subject = "Verification Code for Two-Factor Authentication"
    const message = `Your two-factor authentication code is ${code}. Please use this code to verify your identity.`
    try {
        GmailApp.sendEmail(email, subject, message)
        return { message: "Email sent successfully." }
    } catch (error) {
        throw new Error(`Error sending two-factor authentication code: ${error}`)
    }
}

async function getVerificationCodeEntries() {
    try {
        const result = await VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "table",
            table: "emailVerification",
        })
        return result.data ? result.data : []
    } catch (error) {
        throw new Error(`Failed to fetch email verification code entries ${error.message}`)
    }
}

async function getVerificationCodeEntry(email) {
    try {
        const codes = await getVerificationCodeEntries()
        const codeEntry = codes.find((c) => c.email === email)
        if (codeEntry) {
            return codeEntry
        } else {
            throw new Error("no code found for email")
        }
    } catch (error) {
        throw new Error(`Failed to fetch email verification code entry: ${error.message}`)
    }
}

async function getVerificationCodeByTriggerId(triggerId) {
    try {
        const codes = await getVerificationCodeEntries()
        const codeEntry = codes.find((c) => c.triggerId === triggerId)
        if (codeEntry) {
            return codeEntry
        } else {
            throw new Error(`No code found for trigger: ${triggerId}`)
        }
    } catch (error) {
        throw new Error(`Failed to fetch email verification code by Trigger ID: ${error.message}`)
    }
}

async function createVerificationCode(email) {
    try {
        const existingCode = await getVerificationCodeEntry(email).catch(() => null)
        if (existingCode) {
            return existingCode.code
        }

        const code = generateCode(10)
        const expirationTime = new Date()
        expirationTime.setMinutes(expirationTime.getMinutes() + EXPIRATION_TIME)

        const trigger = ScriptApp.newTrigger("expireVerificationCode")
            .timeBased()
            .at(expirationTime)
            .create()
        const triggerId = trigger.getUniqueId()

        await VaultGS.evaluate({
            key: DB_KEY,
            action: "create",
            type: "entry",
            table: "emailVerification",
            entry: {
                email: email,
                code: code,
                expiration: expirationTime.toLocaleString("en-US", { timeZone: TIMEZONE }),
                triggerId: triggerId,
            },
        })

        return code
    } catch (error) {
        throw new Error(`Failed to create email verification code: ${error.message}`)
    }
}

async function expireVerificationCode(e) {
    try {
        const triggerId = e.triggerUid
        const codeEntry = await getVerificationCodeByTriggerId(triggerId)

        ScriptApp.getProjectTriggers().forEach((trigger) => {
            if (trigger.getUniqueId() == triggerId) {
                ScriptApp.deleteTrigger(trigger)
            }
        })

        await VaultGS.evaluate({
            key: DB_KEY,
            action: "delete",
            type: "entry",
            table: "emailVerification",
            id: codeEntry.id,
        })

        return { message: "Email Verification code expired successfully." }
    } catch (error) {
        throw new Error(`Failed to expire two-factor code: ${error.message}`)
    }
}

async function validateEmailCode(email, code) {
    try {
        const codeEntry = await getVerificationCodeEntry(email)
        if (!codeEntry) {
            throw new Error("No verification code found for the email")
        }

        if (code === codeEntry.code) {
            return true
        } else {
            return false
        }
    } catch (error) {
        throw new Error(`Failed to validate email verification code: ${error.message}`)
    }
}

async function emailVerificationCode(email) {
    const code = await createVerificationCode(email)
    const subject = `Email Verification code`
    const message = `Your Email Verificaiton code is ${code}. Please use this to validate your account creation.`
    try {
        GmailApp.sendEmail(email, subject, message)
        return { message: "Email sent successfully." }
    } catch (error) {
        throw new Error(`Error sending email verification authentication code: ${error}`)
    }
}
