// Google Drive API configuration
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export async function getFileFromDrive(urlOrId: string): Promise<Response> {
  console.log('🔄 Getting file from Drive:', urlOrId);
  
  try {
    // Extract file ID from URL
    const fileId = extractFileId(urlOrId);
    if (!fileId) {
      throw new Error('Invalid Drive URL or file ID');
    }
    console.log('📝 Extracted file ID:', fileId);

    // Get the export URL for the file
    const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log('📥 Downloading file using export URL...');
    
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('❌ Drive API error:', error);
    throw new Error(
      `Failed to get file from Drive: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function extractFileId(urlOrId: string): string | null {
  // Handle various Drive URL formats
  const patterns = [
    /\/file\/d\/([^/]+)/,           // /file/d/{fileId}
    /id=([^&]+)/,                   // id={fileId}
    /^([a-zA-Z0-9_-]{25,})/,       // Raw file ID
    /uc\?.*id=([^&]+)/             // Export URL format
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}