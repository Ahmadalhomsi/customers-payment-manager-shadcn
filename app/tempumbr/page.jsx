"use client"
import React, { useState, useEffect } from 'react';
import { Upload, Download, Loader2, Settings, TestTube, Copy, Check, Trash2 } from 'lucide-react';

export default function UmbracoConverter() {
    const [jsonInput, setJsonInput] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [debugLog, setDebugLog] = useState([]);

    // Configuration
    const [apiUrl, setApiUrl] = useState('https://gncmenu.com/umbraco/backoffice/UmbracoApi/Media/GetById');
    const [xsrfToken, setXsrfToken] = useState('');
    const [umbCulture, setUmbCulture] = useState('tr');
    const [umbUContext, setUmbUContext] = useState('');
    const [umbUContextC, setUmbUContextC] = useState('');
    const [umbXsrfV, setUmbXsrfV] = useState('');
    const [showConfig, setShowConfig] = useState(false);
    const [connectionTested, setConnectionTested] = useState(false);
    const [copiedField, setCopiedField] = useState('');

    // Load saved configuration
    useEffect(() => {
        const savedConfig = localStorage.getItem('umbraco-converter-config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                setApiUrl(config.apiUrl || 'https://gncmenu.com/umbraco/backoffice/UmbracoApi/Media/GetById');
                setXsrfToken(config.xsrfToken || '');
                setUmbCulture(config.umbCulture || 'tr');
                setUmbUContext(config.umbUContext || '');
                setUmbUContextC(config.umbUContextC || '');
                setUmbXsrfV(config.umbXsrfV || '');
                setConnectionTested(config.connectionTested || false);
            } catch (e) {
                console.error('Failed to load saved config:', e);
            }
        }
    }, []);

    // Save configuration when changed
    useEffect(() => {
        const config = {
            apiUrl,
            xsrfToken,
            umbCulture,
            umbUContext,
            umbUContextC,
            umbXsrfV,
            connectionTested
        };
        localStorage.setItem('umbraco-converter-config', JSON.stringify(config));
    }, [apiUrl, xsrfToken, umbCulture, umbUContext, umbUContextC, umbXsrfV, connectionTested]);

    const addDebugLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLog(prev => [...prev, { timestamp, message, type }]);
        console.log(`[${timestamp}] ${message}`);
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(''), 2000);
        });
    };

    const clearConfig = () => {
        if (window.confirm('Are you sure you want to clear all configuration?')) {
            setApiUrl('https://gncmenu.com/umbraco/backoffice/UmbracoApi/Media/GetById');
            setXsrfToken('');
            setUmbCulture('tr');
            setUmbUContext('');
            setUmbUContextC('');
            setUmbXsrfV('');
            setConnectionTested(false);
            localStorage.removeItem('umbraco-converter-config');
            addDebugLog('Configuration cleared', 'info');
        }
    };

    // Test connection with a sample media ID
    const testConnection = async () => {
        if (!xsrfToken.trim()) {
            setError('Please enter X-UMB-XSRF-TOKEN first');
            return;
        }

        setError('');
        addDebugLog('Testing connection...', 'info');

        // Sample media ID for testing
        const testMediaId = 'd56b08a583864359a2a12f3bb8f31340';

        // Use the Next.js API route instead of direct fetch
        const url = `/api/umbraco-proxy?id=${testMediaId}`;

        // Build cookie string manually
        const cookieParts = [];
        if (umbUContext) cookieParts.push(`UMB_UCONTEXT=${umbUContext}`);
        if (umbUContextC) cookieParts.push(`UMB_UCONTEXT_C=${encodeURIComponent(umbUContextC)}`);
        if (xsrfToken) cookieParts.push(`UMB-XSRF-TOKEN=${xsrfToken}`);
        if (umbXsrfV) cookieParts.push(`UMB-XSRF-V=${umbXsrfV}`);
        const cookieString = cookieParts.join(';');

        const headers = {
            "X-UMB-XSRF-TOKEN": xsrfToken,
            "X-UMB-Cookie": cookieString, // Custom header for our proxy
        };

        addDebugLog(`Request URL: ${url}`, 'debug');
        addDebugLog(`Using Next.js proxy route`, 'debug');

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            addDebugLog(`Response status: ${response.status}`, response.ok ? 'success' : 'error');

            if (response.ok) {
                const data = await response.json();
                if (data.mediaLink) {
                    setConnectionTested(true);
                    addDebugLog(`✓ Connection successful! Media link: ${data.mediaLink}`, 'success');
                    alert('Connection test successful! Configuration is working.');
                } else if (data.error) {
                    addDebugLog(`✗ Proxy error: ${data.error}`, 'error');
                    alert(`Connection test failed: ${data.error}`);
                } else {
                    addDebugLog('✗ Connection test failed: No mediaLink in response', 'error');
                    addDebugLog(`Response data: ${JSON.stringify(data)}`, 'debug');
                    alert('Connection test failed. Response format unexpected.');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                addDebugLog(`✗ Connection test failed: Status ${response.status}: ${JSON.stringify(errorData)}`, 'error');
                alert(`Connection test failed. Status: ${response.status}\n${errorData.error || ''}`);
            }
        } catch (err) {
            addDebugLog(`✗ Connection test error: ${err.message}`, 'error');
            alert(`Connection test error: ${err.message}`);
        }
    };

    // Extract all media IDs from the JSON
    const extractMediaIds = (text) => {
        const regex = /umb:\/\/media\/([a-f0-9]{32})/g;
        const ids = new Set();
        let match;

        while ((match = regex.exec(text)) !== null) {
            ids.add(match[1]);
        }

        return Array.from(ids);
    };

    // Fetch filename for a single media ID
    const fetchMediaFilename = async (mediaId) => {
        // Use the Next.js API route instead of direct fetch
        const url = `/api/umbraco-proxy?id=${mediaId}`;

        addDebugLog(`Fetching media ID: ${mediaId}`, 'info');

        // Build cookie string manually
        const cookieParts = [];
        if (umbCulture) cookieParts.push(`UMB_MCULTURE=${umbCulture}`);
        if (umbUContext) cookieParts.push(`UMB_UCONTEXT=${umbUContext}`);
        if (umbUContextC) cookieParts.push(`UMB_UCONTEXT_C=${encodeURIComponent(umbUContextC)}`);
        if (xsrfToken) cookieParts.push(`UMB-XSRF-TOKEN=${xsrfToken}`);
        if (umbXsrfV) cookieParts.push(`UMB-XSRF-V=${umbXsrfV}`);
        const cookieString = cookieParts.join(';');

        const headers = {
            "X-UMB-XSRF-TOKEN": xsrfToken,
            "X-UMB-Cookie": cookieString, // Custom header for our proxy
            "X-UMB-CULTURE": umbCulture,
        };

        addDebugLog(`Using Next.js proxy route for media ID: ${mediaId}`, 'debug');

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });

            addDebugLog(`Response status: ${response.status}`, response.ok ? 'success' : 'error');

            if (response.ok) {
                const data = await response.json();
                addDebugLog(`Response data: ${JSON.stringify(data).substring(0, 200)}...`, 'debug');

                if (data.error) {
                    addDebugLog(`✗ Proxy error for ${mediaId}: ${data.error}`, 'error');
                    return { mediaId, filename: null, error: data.error, success: false };
                }

                const mediaLink = data.mediaLink || '';

                if (!mediaLink) {
                    addDebugLog(`✗ No mediaLink in response for ${mediaId}`, 'error');
                    return { mediaId, filename: null, error: 'No mediaLink in response', success: false };
                }

                // Extract filename from media link
                let filename = '';
                try {
                    const urlParts = mediaLink.split('/');
                    const lastPart = urlParts[urlParts.length - 1];
                    filename = lastPart.split('.')[0];
                } catch (e) {
                    addDebugLog(`Warning: Could not extract filename from mediaLink: ${mediaLink}`, 'debug');
                    // If we can't extract filename, use a fallback
                    filename = `media_${mediaId.substring(0, 8)}`;
                }

                addDebugLog(`✓ Success: ${mediaId} -> ${filename}`, 'success');
                return { mediaId, filename, mediaLink, success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                addDebugLog(`✗ Failed: ${mediaId} - Status ${response.status}: ${JSON.stringify(errorData)}`, 'error');
                return { mediaId, filename: null, error: `Status ${response.status}`, success: false };
            }
        } catch (err) {
            addDebugLog(`✗ Error: ${mediaId} - ${err.message}`, 'error');
            return { mediaId, filename: null, error: err.message, success: false };
        }
    };

    // Process all media IDs
    const handleConvert = async () => {
        setError('');
        setResults([]);
        setDebugLog([]);

        if (!jsonInput.trim()) {
            setError('Please paste your JSON content');
            return;
        }

        if (!xsrfToken) {
            setError('Please configure X-UMB-XSRF-TOKEN in settings');
            return;
        }

        if (!connectionTested) {
            if (!window.confirm('You haven\'t tested the connection. Test it first to avoid issues. Continue anyway?')) {
                return;
            }
        }

        addDebugLog('Starting conversion process...', 'info');

        const mediaIds = extractMediaIds(jsonInput);

        if (mediaIds.length === 0) {
            setError('No media IDs found in the provided JSON');
            addDebugLog('No media IDs found', 'error');
            return;
        }

        addDebugLog(`Found ${mediaIds.length} unique media IDs`, 'info');

        setLoading(true);
        const allResults = [];

        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < mediaIds.length; i++) {
            addDebugLog(`Processing ${i + 1}/${mediaIds.length}`, 'info');
            const result = await fetchMediaFilename(mediaIds[i]);
            allResults.push(result);
            setResults([...allResults]);

            // Small delay between requests
            if (i < mediaIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        setLoading(false);
        addDebugLog('Conversion complete!', 'success');
    };

    // Generate replacement JSON
    const generateReplacedJson = () => {
        let replacedJson = jsonInput;

        results.forEach(result => {
            if (result.success && result.filename) {
                const pattern = new RegExp(`umb://media/${result.mediaId}`, 'g');
                replacedJson = replacedJson.replace(pattern, result.filename);
            }
        });

        return replacedJson;
    };

    const downloadResults = () => {
        const content = results
            .filter(r => r.success)
            .map(r => `${r.mediaId},${r.filename}`)
            .join('\n');

        const blob = new Blob([`Media ID,Filename\n${content}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'media-filenames.csv';
        a.click();
    };

    const downloadReplacedJson = () => {
        const replacedJson = generateReplacedJson();
        const blob = new Blob([replacedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'replaced-data.json';
        a.click();
    };

    const downloadDebugLog = () => {
        const logContent = debugLog.map(log =>
            `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
        ).join('\n');

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'debug-log.txt';
        a.click();
    };

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Umbraco Media ID Converter
                            </h1>
                            <p className="text-gray-600">
                                Extract media IDs from JSON and convert them to filenames
                            </p>
                        </div>
                        {connectionTested && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                <Check size={14} />
                                Connection Verified
                            </span>
                        )}
                    </div>

                    {/* Configuration Section */}
                    <div className="mb-6 border border-gray-200 rounded-lg">
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Settings size={20} className="text-gray-600" />
                                <span className="font-semibold text-gray-800">API Configuration</span>
                                {xsrfToken && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {connectionTested ? 'Configured & Tested' : 'Configured'}
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-400">{showConfig ? '▼' : '▶'}</span>
                        </button>

                        {showConfig && (
                            <div className="p-4 border-t border-gray-200 space-y-4">
                                {/* Configuration Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={testConnection}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <TestTube size={18} />
                                            Test Connection
                                        </button>
                                        {connectionTested && (
                                            <span className="text-sm text-green-600 font-medium">
                                                ✓ Configuration working
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={clearConfig}
                                        className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        <Trash2 size={16} />
                                        Clear All
                                    </button>
                                </div>

                                {/* Configuration Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            API URL
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={apiUrl}
                                                onChange={(e) => setApiUrl(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(apiUrl, 'apiUrl')}
                                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                title="Copy to clipboard"
                                            >
                                                {copiedField === 'apiUrl' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            UMB_MCULTURE
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={umbCulture}
                                                onChange={(e) => setUmbCulture(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                                            />
                                            <button
                                                onClick={() => copyToClipboard(umbCulture, 'umbCulture')}
                                                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                title="Copy to clipboard"
                                            >
                                                {copiedField === 'umbCulture' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        X-UMB-XSRF-TOKEN *
                                        <span className="text-red-500 ml-1">Required</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={xsrfToken}
                                            onChange={(e) => setXsrfToken(e.target.value)}
                                            placeholder="p5Ml-CFyn3kJpNFzsBg2Ge87B23lKx6j0EnNhBNuwnQ..."
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(xsrfToken, 'xsrfToken')}
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            title="Copy to clipboard"
                                        >
                                            {copiedField === 'xsrfToken' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UMB-XSRF-V
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={umbXsrfV}
                                            onChange={(e) => setUmbXsrfV(e.target.value)}
                                            placeholder="nFSXjaAMvQJhTXz4UUief2d75gk9iK5vJjWFh2Y5E6Hf..."
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(umbXsrfV, 'umbXsrfV')}
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            title="Copy to clipboard"
                                        >
                                            {copiedField === 'umbXsrfV' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UMB_UCONTEXT
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={umbUContext}
                                            onChange={(e) => setUmbUContext(e.target.value)}
                                            placeholder="7D-EdZCNcLWze3Tz36keoX-wg7jcB45qhd_uq1Bk35R98ZPy8r..."
                                            className="w-full h-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs pr-10"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(umbUContext, 'umbUContext')}
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            title="Copy to clipboard"
                                        >
                                            {copiedField === 'umbUContext' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UMB_UCONTEXT_C
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={umbUContextC}
                                            onChange={(e) => setUmbUContextC(e.target.value)}
                                            placeholder="2026-01-12T09:15:29.3943984+00:00"
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm pr-10"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(umbUContextC, 'umbUContextC')}
                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                            title="Copy to clipboard"
                                        >
                                            {copiedField === 'umbUContextC' ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Help Section */}
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="font-bold">ℹ️ How to get these values:</span>
                                    </div>
                                    <ol className="list-decimal list-inside ml-4 space-y-1">
                                        <li>Login to your Umbraco backend</li>
                                        <li>Open Developer Tools (F12)</li>
                                        <li>Go to <strong>Network</strong> tab</li>
                                        <li>Reload the page or make any action</li>
                                        <li>Find any request to <code>/umbraco/</code></li>
                                        <li>In request headers, look for:
                                            <ul className="list-disc list-inside ml-6">
                                                <li><code>X-UMB-XSRF-TOKEN</code> in headers</li>
                                                <li><code>Cookie</code> header containing UMB_* values</li>
                                            </ul>
                                        </li>
                                    </ol>
                                    <div className="mt-2 p-2 bg-blue-100 rounded">
                                        <strong>Tip:</strong> Always test connection before converting large files.
                                    </div>
                                </div>

                                {/* Current Configuration Summary */}
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                                    <div className="font-semibold text-gray-700 mb-2">Current Configuration:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="font-mono truncate" title={xsrfToken}>
                                            <span className="text-gray-500">XSRF Token:</span> {xsrfToken ? `${xsrfToken.substring(0, 20)}...` : 'Not set'}
                                        </div>
                                        <div className="font-mono truncate" title={umbUContext}>
                                            <span className="text-gray-500">UCONTEXT:</span> {umbUContext ? `${umbUContext.substring(0, 20)}...` : 'Not set'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* JSON Input Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Paste your JSON content (with media IDs)
                            </label>
                            <span className="text-xs text-gray-500">
                                {extractMediaIds(jsonInput).length} media IDs found
                            </span>
                        </div>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            placeholder='Paste JSON containing "umb://media/..." references'
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <div className="flex items-start gap-2">
                                <span className="font-bold">Error:</span>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleConvert}
                        disabled={loading || !xsrfToken}
                        className={`w-full ${xsrfToken ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing... ({successCount + failCount}/{extractMediaIds(jsonInput).length})
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Convert Media IDs
                                {!xsrfToken && <span className="text-sm ml-2">(Configure XSRF Token first)</span>}
                            </>
                        )}
                    </button>

                    {/* Debug Log */}
                    {debugLog.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-800">Debug Log</h3>
                                <button
                                    onClick={downloadDebugLog}
                                    className="flex items-center gap-1 text-sm bg-gray-600 hover:bg-gray-700 text-white py-1 px-3 rounded transition-colors"
                                >
                                    <Download size={14} />
                                    Download Log
                                </button>
                            </div>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-xs">
                                {debugLog.map((log, index) => (
                                    <div
                                        key={index}
                                        className={`${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'success' ? 'text-green-400' :
                                                log.type === 'debug' ? 'text-gray-500' :
                                                    'text-gray-300'
                                            }`}
                                    >
                                        [{log.timestamp}] {log.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {results.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Results
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {successCount} successful, {failCount} failed
                                        <span className="ml-2 text-xs">
                                            ({Math.round((successCount / results.length) * 100)}% success rate)
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={downloadResults}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <Download size={18} />
                                        CSV
                                    </button>
                                    <button
                                        onClick={downloadReplacedJson}
                                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                        <Download size={18} />
                                        Replaced JSON
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-100">
                                        <tr>
                                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">#</th>
                                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Media ID</th>
                                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Filename</th>
                                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((result, index) => (
                                            <tr key={index} className={`border-t border-gray-200 ${result.success ? 'bg-white' : 'bg-red-50'}`}>
                                                <td className="py-2 px-3 text-sm text-gray-500">
                                                    {index + 1}
                                                </td>
                                                <td className="py-2 px-3 text-xs font-mono text-gray-600">
                                                    {result.mediaId.substring(0, 16)}...
                                                    <br />
                                                    <span className="text-gray-400 text-xs">{result.mediaId.substring(16)}</span>
                                                </td>
                                                <td className="py-2 px-3 text-sm font-medium text-gray-800">
                                                    {result.success ? (
                                                        <div>
                                                            <div className="font-medium">{result.filename}</div>
                                                            {result.mediaLink && (
                                                                <div className="text-xs text-gray-500 truncate" title={result.mediaLink}>
                                                                    {result.mediaLink.substring(0, 50)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {result.success ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                            <Check size={12} />
                                                            Success
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded max-w-xs truncate"
                                                            title={`Error: ${result.error}`}>
                                                            {result.error}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}