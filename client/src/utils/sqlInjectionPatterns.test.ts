// client/src/utils/sqlInjectionPatterns.test.ts
import { describe, it, expect } from 'vitest';
import {
  sqlInjectionPatterns,
  decodeUrl,
  decodeHex,
} from './sqlInjectionPatterns';

describe('SQL Injection Patterns', () => {
  describe('classic patterns', () => {
    it('should detect basic OR 1=1', () => {
      expect("' OR '1'='1'--").toMatch(sqlInjectionPatterns.classic[0]);
      expect("foo' OR '1'='1'/*").toMatch(sqlInjectionPatterns.classic[0]);
    });

    it('should detect basic OR TRUE', () => {
      expect("1' OR TRUE").toMatch(sqlInjectionPatterns.classic[1]);
      expect("1' OR 'TRUE'").toMatch(sqlInjectionPatterns.classic[1]);
    });

    it('should detect union select', () => {
      expect('UNION SELECT null, null--').toMatch(
        sqlInjectionPatterns.classic[3],
      );
      expect('UNION ALL SELECT user, password FROM users').toMatch(
        sqlInjectionPatterns.classic[3],
      );
    });

    it('should detect stacked queries with DROP TABLE', () => {
      expect("'; DROP TABLE users;--").toMatch(sqlInjectionPatterns.classic[5]);
      expect('foo; ALTER TABLE products ADD COLUMN description TEXT;').toMatch(
        sqlInjectionPatterns.classic[5],
      );
    });

    it('should detect comments', () => {
      expect("admin'--").toMatch(sqlInjectionPatterns.classic[6]);
      expect("admin'/*").toMatch(sqlInjectionPatterns.classic[6]);
      expect("admin';#").toMatch(sqlInjectionPatterns.classic[7]);
    });
  });

  describe('time-based patterns', () => {
    it('should detect SQL Server WAITFOR DELAY', () => {
      expect("WAITFOR DELAY '00:00:05'").toMatch(
        sqlInjectionPatterns.timeBased[0],
      );
    });

    it('should detect PostgreSQL PG_SLEEP', () => {
      expect('PG_SLEEP(5)').toMatch(sqlInjectionPatterns.timeBased[1]);
    });

    it('should detect MySQL SLEEP', () => {
      expect('SLEEP(5)').toMatch(sqlInjectionPatterns.timeBased[2]);
    });

    it('should detect MySQL BENCHMARK', () => {
      expect('BENCHMARK(10000000,MD5(1))').toMatch(
        sqlInjectionPatterns.timeBased[3],
      );
      expect("BENCHMARK(10000000,MD5('test'))").toMatch(
        sqlInjectionPatterns.timeBased[3],
      );
    });
  });

  describe('boolean-based patterns', () => {
    it('should detect AND 1=1', () => {
      expect('AND 1=1').toMatch(sqlInjectionPatterns.booleanBased[0]);
      expect("AND '1'='1'").toMatch(sqlInjectionPatterns.booleanBased[0]);
    });

    it('should detect OR 1=2', () => {
      expect('OR 1=2').toMatch(sqlInjectionPatterns.booleanBased[1]);
      expect("OR '1'='2'").toMatch(sqlInjectionPatterns.booleanBased[1]);
    });

    it('should detect AND TRUE/FALSE', () => {
      expect('AND TRUE').toMatch(sqlInjectionPatterns.booleanBased[2]);
      expect('AND FALSE').toMatch(sqlInjectionPatterns.booleanBased[2]);
    });
  });
});

describe('decodeUrl', () => {
  it('should correctly decode URL-encoded strings', () => {
    expect(decodeUrl('SELECT%20*%20FROM%20users')).toBe('SELECT * FROM users');
    expect(decodeUrl('1%27%20OR%20%271%27%3D%271')).toBe("1' OR '1'='1");
    expect(decodeUrl('WAITFOR+DELAY+%2700%3A00%3A05%27')).toBe(
      "WAITFOR DELAY '00:00:05'",
    );
  });

  it('should handle already decoded strings', () => {
    expect(decodeUrl('SELECT * FROM users')).toBe('SELECT * FROM users');
  });

  it('should handle invalid URL encoding gracefully', () => {
    expect(decodeUrl('%zz')).toBe('%zz');
  });
});

describe('decodeHex', () => {
  it('should correctly decode hex-encoded strings', () => {
    expect(decodeHex('53454c454354202a2046524f4d207573657273')).toBe(
      'SELECT * FROM users',
    );
    expect(decodeHex('0x53454c454354202a2046524f4d207573657273')).toBe(
      'SELECT * FROM users',
    );
  });

  it('should handle already decoded strings', () => {
    expect(decodeHex('SELECT * FROM users')).toBe('SELECT * FROM users');
  });

  it('should handle invalid hex encoding gracefully', () => {
    expect(decodeHex('ZZZ')).toBe('ZZZ');
    expect(decodeHex('53454c454354202a2046524f4d20757365727')).toBe(
      '53454c454354202a2046524f4d20757365727',
    ); // Odd length
  });
});
