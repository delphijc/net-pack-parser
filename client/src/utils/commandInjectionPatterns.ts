// client/src/utils/commandInjectionPatterns.ts

/**
 * Regular expression patterns for detecting Command Injection attacks.
 */
export const commandInjectionPatterns = {
    // Shell metacharacters and common commands
    // Matches things like: ; ls, | whoami, && cat, `uname`
    shellCommands: [
        /(?:;|\||&&|\$|\(|`)\s*(?:ls|cat|whoami|id|uname|pwd|wget|curl|nc|netcat|bash|sh|python|perl|ruby|php|gcc|make|tar|zip|unzip)\b/gim,
    ],

    // Specific Windows commands
    windowsCommands: [
        /(?:&|\|)\s*(?:dir|type|ipconfig|net user|net localgroup|tasklist|systeminfo|whoami)\b/gim,
    ],

    // PowerShell
    powerShell: [
        /powershell(?:\.exe)?\b/gim,
        /(?:;|\|)\s*(?:Get-Process|Get-ChildItem|Get-Content|Invoke-WebRequest|Invoke-Expression)\b/gim,
    ],
};
