/// <reference path="./types/cap.d.ts" />
import { Cap } from 'cap';

console.log('Verifying Cap installation...');
try {
  const devices = Cap.deviceList();
  console.log('Cap loaded successfully!');
  console.log(`Found ${devices.length} network interfaces.`);
  devices.forEach((d: any) =>
    console.log(` - ${d.name} (${d.addresses.length} addresses)`),
  );
} catch (err) {
  console.error('Failed to load Cap or list devices:', err);
  process.exit(1);
}
