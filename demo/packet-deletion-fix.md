# Fix: Packet Deletion Not Working

## Problem
Clicking the delete button on packets didn't visibly remove them from the packet list.

## Root Cause
The `PacketList` component calls `database.deletePacket()` which successfully removes packets from IndexedDB, but the parent component (`PcapAnalysisPage`) wasn't notified of the deletion. 

While `PcapAnalysisPage` has a polling mechanism that reloads packets every 100ms, there was no immediate callback when a packet was deleted, causing:
1. Brief delay before the packet disappeared
2. Potential race conditions during the polling interval
3. No guarantee the UI would update immediately after deletion

## Solution
Added an `onPacketDeleted` callback that:
1. Immediately reloads all packets from the database
2. Re-runs threat detection for the updated packet list
3. Updates all related state (threats, protocols, etc.)

### Changes Made

**PcapAnalysisPage.tsx**:
```typescript
const handlePacketDeleted = useCallback(async () => {
  // Force an immediate reload when a packet is deleted
  const packetsFromDb = await database.getAllPackets();
  setAllPackets(packetsFromDb);

  // Run threat detection for all packets
  const threatPromises = packetsFromDb.map((packet) =>
    runThreatDetection(packet),
  );
  const threatsResults = await Promise.all(threatPromises);
  const detectedThreats: ThreatAlert[] = threatsResults.flat();
  setAllThreats(detectedThreats);

  // Map threats to suspiciousIndicators and update state
  // ... (full implementation in code)
}, []);
```

Then passed it to `PacketList`:
```typescript
<PacketList
  // ... other props
  onPacketDeleted={handlePacketDeleted}
/>
```

**PacketList.tsx**:
The component already had support for this callback (line 98):
```typescript
onPacketDeleted?.(); // Notify parent that a packet was deleted
```

## How It Works Now
1. User clicks delete button on a packet
2. `PacketList.handleDeletePacket()` calls `database.deletePacket()`
3. After deletion, calls `onPacketDeleted?.()`
4. Parent's `handlePacketDeleted` immediately refreshes the entire packet list
5. UI updates instantly, showing the packet removed

## Files Modified
- [`client/src/pages/PcapAnalysisPage.tsx`](file:///Users/delphijc/Projects/net-pack-parser/client/src/pages/PcapAnalysisPage.tsx) - Added `handlePacketDeleted` callback

## Verification
Build succeeds ✅
```bash
cd client && npm run build
# ✓ built in 1.81s
```

Packet deletion should now work immediately without waiting for the polling interval.
