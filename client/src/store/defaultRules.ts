
export const defaultYaraRules = [
    {
        name: 'Basic HTTP Auth',
        content: `
rule BasicAuth {
    meta:
        description = "Detects Basic Authentication headers"
        severity = "medium"
        mitre = "T1552.001"
    strings:
        $auth = "Authorization: Basic" nocase
    condition:
        $auth
}`,
    },
    {
        name: 'Shellshock Exploit',
        content: `
rule ShellShock {
    meta:
        description = "Detects Shellshock exploit attempts"
        severity = "critical"
        mitre = "T1190"
    strings:
        $s1 = "() { :; };"
    condition:
        $s1
}`,
    },
    {
        name: 'Simple SQL Injection Keywords',
        content: `
rule GenericSQLi {
    meta:
        description = "Detects common SQL injection keywords"
        severity = "high"
        mitre = "T1190"
    strings:
        $s1 = "UNION SELECT" nocase
        $s2 = "OR 1=1"
        $s3 = "DROP TABLE" nocase
    condition:
        any of them
}`,
    },
    {
        name: 'Executable File Header (MZ)',
        content: `
rule MZHeader {
    meta:
        description = "Detects Windows executable file header in packet"
        severity = "low"
        mitre = "T1001"
    strings:
        $mz = "MZ"
    condition:
        $mz at 0
}`,
    }
];
