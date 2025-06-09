# Network Traffic Parser

A comprehensive web application for monitoring network performance and analyzing network traffic data. Built with React, TypeScript, and Tailwind CSS, this tool helps developers monitor application performance in real-time and analyze static PCAP files for deeper insights.

## 🚀 Key Features Implemented

### Real-Time Performance Monitoring
- **Core Web Vitals Tracking**: Largest Contentful Paint (LCP), First Contentful Paint (FCP), and overall page load performance
- **Resource Timing Analysis**: Monitor all network requests, transfer sizes, and load times
- **Long Task Detection**: Identify performance bottlenecks caused by long-running JavaScript tasks
- **Navigation Timing**: Comprehensive page load waterfall analysis
- **Performance Scoring**: Automated scoring system based on industry best practices

### Network Traffic Analysis
- **PCAP File Support**: Upload and parse Wireshark capture files
- **Token Extraction**: Identify and categorize non-alphanumeric characters and string content
- **Protocol Detection**: Automatic classification of HTTP, HTTPS, FTP, SMTP, and other protocols
- **File Reference Detection**: Automatically detect and extract downloadable file references from network traffic
- **Section Analysis**: Parse headers, body, and footer sections from network data

### Data Management
- **Local Storage**: All data stored securely in your browser
- **Search & Filter**: Advanced search capabilities across packets, tokens, and strings
- **Export Capabilities**: Download detected files and view file previews
- **Performance History**: Track performance metrics over time with configurable time ranges

## 📊 Performance Metrics Tracked

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: Time until the largest element is rendered
- **First Contentful Paint (FCP)**: Time until the first content appears
- **Page Load Time**: Complete page loading duration
- **DOM Interactive Time**: Time until the DOM becomes interactive

### Resource Performance
- **Network Requests**: Count and timing of all resource loads
- **Transfer Sizes**: Bandwidth usage and payload sizes
- **Resource Types**: Analysis by initiator type (XHR, fetch, script, etc.)
- **Cache Performance**: Hit rates and cache efficiency

### JavaScript Performance
- **Long Tasks**: Tasks that block the main thread for >50ms
- **Task Attribution**: Identify which scripts cause performance issues
- **Total Blocking Time**: Cumulative impact of long tasks

## 🛠️ How to Use

### Getting Started

1. **Start the Application**
   ```bash
   npm install
   npm run dev
   ```

2. **Navigate to Performance Dashboard**
   - Click on "Performance" in the sidebar to access real-time monitoring

### Performance Monitoring

1. **Start Real-Time Capture**
   - Go to "Parser" tab
   - Click "Start Capture" to begin monitoring network activity
   - Browse different websites or perform actions to generate traffic
   - Click "Stop Capture" when finished

2. **View Performance Metrics**
   - Navigate to "Performance" tab
   - View your overall performance score (0-100)
   - Analyze Core Web Vitals metrics
   - Review resource loading patterns
   - Check for long tasks that may impact user experience

3. **Time-Based Analysis**
   - Use the time filter dropdown (1h, 24h, 7d, All Time)
   - Compare performance across different time periods
   - Identify performance trends and regressions

### Network Traffic Analysis

1. **Manual Data Entry**
   - Go to "Parser" tab
   - Paste network data (HTTP headers, email content, etc.) into the text area
   - Click "Parse Data" to analyze the content

2. **PCAP File Upload**
   - Click "Upload PCAP" button
   - Select a .pcap or .cap file from Wireshark or similar tools
   - The application will automatically parse packet headers and payload data

3. **Sample Data**
   - Use the "Load HTTP Request", "Load HTTP Response", or "Load Email" buttons
   - These provide example data to demonstrate parsing capabilities

### Viewing Results

1. **Dashboard Overview**
   - View high-level statistics and protocol distribution
   - Click on metric cards to navigate to detailed views

2. **Packets Analysis**
   - Browse all captured network packets
   - Sort by timestamp, protocol, source, or destination
   - Click on packets to view detailed information
   - Send packets to filters for further analysis

3. **Files Management**
   - View all detected file references
   - Download files directly or open source URLs
   - Preview supported file types (images, PDFs, text files)

4. **Tokens & Strings**
   - Analyze extracted tokens (non-alphanumeric characters)
   - Search through string content
   - View occurrence statistics across packets

## 🎯 Use Cases

### Performance Optimization
- **Web Developer**: Monitor your application's Core Web Vitals in real-time
- **DevOps Engineer**: Track performance metrics across deployments
- **QA Tester**: Identify performance regressions during testing

### Network Analysis
- **Security Analyst**: Parse PCAP files to extract file references and analyze traffic patterns
- **Network Engineer**: Analyze protocol distribution and traffic characteristics
- **Forensics**: Extract and download files referenced in network communications

### Development Workflow
1. **Baseline Measurement**: Establish performance benchmarks using the real-time capture
2. **Code Changes**: Make application improvements
3. **Impact Assessment**: Compare new performance metrics against baseline
4. **Optimization**: Use detailed timing data to identify specific bottlenecks

## 🔧 Technical Details

### Browser Compatibility
- Uses PerformanceObserver API for real-time monitoring
- Fallback support for browsers with limited Performance API support
- All data processing happens client-side for privacy and security

### Data Storage
- All data stored locally in browser localStorage
- No external servers or data transmission
- Use "Clear Data" buttons to reset application state

### Performance Impact
- Minimal overhead from monitoring (< 1% performance impact)
- Efficient data structures for large datasets
- Automatic cleanup of old performance entries

## 🚨 Limitations

### Network Capture Scope
- **Browser-Level Only**: Cannot capture OS-level network traffic like tcpdump
- **Same-Origin Policy**: Limited by browser security for cross-origin requests
- **HTTPS Limitations**: Cannot decrypt HTTPS payload content (headers only)

### Performance API Constraints
- Some metrics require HTTPS for security reasons
- Long Task API may not be available in all browsers
- Layout Shift detection requires user interaction

## 🔄 Data Management

### Clearing Data
- **Performance Data**: Use "Clear Data" button in Performance dashboard
- **All Application Data**: Use browser's developer tools to clear localStorage
- **Selective Deletion**: Delete individual packets or files as needed

### Export Options
- Download detected files for offline analysis
- Copy performance metrics for reporting
- Export packet data for external tools

This application provides a comprehensive toolkit for both real-time performance monitoring and post-hoc network traffic analysis, making it valuable for developers, analysts, and engineers working on web application optimization and network security.