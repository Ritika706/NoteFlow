const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Compress PDF using Ghostscript (must be installed on the system).
 * On Render/Linux: gs is typically available.
 * On Windows: install Ghostscript and ensure gswin64c.exe is in PATH.
 */
async function compressPdfWithGhostscript(inputBuffer, { quality = 'ebook' } = {}) {
  if (!Buffer.isBuffer(inputBuffer)) {
    throw new Error('Input must be a Buffer');
  }

  // Quality presets (Ghostscript -dPDFSETTINGS):
  // /screen   = lowest quality, smallest size (~72 dpi)
  // /ebook    = medium quality (~150 dpi) - good balance
  // /printer  = high quality (~300 dpi)
  // /prepress = highest quality, largest size
  const validQualities = ['screen', 'ebook', 'printer', 'prepress'];
  const pdfSettings = validQualities.includes(quality) ? quality : 'ebook';

  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const inputPath = path.join(tmpDir, `gs_input_${timestamp}.pdf`);
  const outputPath = path.join(tmpDir, `gs_output_${timestamp}.pdf`);

  try {
    // Write input buffer to temp file
    await fs.promises.writeFile(inputPath, inputBuffer);

    // Determine gs command (Windows vs Linux)
    const isWindows = process.platform === 'win32';
    const gsCmd = isWindows ? 'gswin64c' : 'gs';

    const args = [
      '-sDEVICE=pdfwrite',
      `-dPDFSETTINGS=/${pdfSettings}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dCompatibilityLevel=1.4',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    // Run Ghostscript
    await new Promise((resolve, reject) => {
      const proc = spawn(gsCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let stderr = '';
      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Ghostscript exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
          reject(new Error('Ghostscript not found. Please install Ghostscript.'));
        } else {
          reject(err);
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        proc.kill();
        reject(new Error('Ghostscript timed out'));
      }, 60_000);
    });

    // Read compressed output
    const outputBuffer = await fs.promises.readFile(outputPath);
    return outputBuffer;
  } finally {
    // Cleanup temp files
    try { await fs.promises.unlink(inputPath); } catch (e) { /* ignore */ }
    try { await fs.promises.unlink(outputPath); } catch (e) { /* ignore */ }
  }
}

/**
 * Check if Ghostscript is available on the system.
 */
async function isGhostscriptAvailable() {
  const isWindows = process.platform === 'win32';
  const gsCmd = isWindows ? 'gswin64c' : 'gs';

  return new Promise((resolve) => {
    const proc = spawn(gsCmd, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5000);
  });
}

module.exports = {
  compressPdfWithGhostscript,
  isGhostscriptAvailable,
};
