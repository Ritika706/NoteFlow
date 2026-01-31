const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getMaxBytes() {
  const mb = Number(process.env.PDF_CLOUDINARY_MAX_MB || 10);
  return Math.max(1, mb) * 1024 * 1024;
}

function getGhostscriptCandidates() {
  // Prefer explicit path if provided
  const explicit = process.env.GHOSTSCRIPT_PATH;
  const candidates = [];
  if (explicit) candidates.push(explicit);

  if (process.platform === 'win32') {
    // Common install locations (helps when Ghostscript isn't on PATH)
    const programFiles = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean);
    for (const base of programFiles) {
      try {
        const gsRoot = path.join(base, 'gs');
        if (!fs.existsSync(gsRoot)) continue;
        const versions = fs
          .readdirSync(gsRoot, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort()
          .reverse();
        for (const v of versions) {
          const p64 = path.join(gsRoot, v, 'bin', 'gswin64c.exe');
          const p32 = path.join(gsRoot, v, 'bin', 'gswin32c.exe');
          if (fs.existsSync(p64)) candidates.push(p64);
          if (fs.existsSync(p32)) candidates.push(p32);
        }
      } catch (e) {
        // ignore
      }
    }

    candidates.push('gswin64c');
    candidates.push('gswin32c');
    candidates.push('gs');
  } else {
    candidates.push('gs');
  }

  return candidates;
}

function parseQualities(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCompressionProfiles() {
  // Order matters: we try from higher quality to more aggressive.
  // Default aims for decent readability, then smaller fallback.
  const envQualities = parseQualities(process.env.PDF_GS_QUALITIES);
  const legacyQuality = String(process.env.PDF_GS_QUALITY || '').trim();
  const baseQualities = envQualities.length
    ? envQualities
    : legacyQuality
      ? [legacyQuality]
      : ['/ebook', '/screen'];

  const profiles = [];
  for (const q of baseQualities) {
    profiles.push({ quality: q, extraArgs: [] });
  }

  // Optional extra-aggressive downsampling pass (use only if you must).
  const enableAggressive = String(process.env.PDF_GS_AGGRESSIVE || 'true').toLowerCase() !== 'false';
  if (enableAggressive) {
    profiles.push({
      quality: '/screen',
      extraArgs: [
        '-dDetectDuplicateImages=true',
        '-dDownsampleColorImages=true',
        '-dColorImageDownsampleType=/Bicubic',
        '-dColorImageResolution=96',
        '-dDownsampleGrayImages=true',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dGrayImageResolution=96',
        '-dDownsampleMonoImages=true',
        '-dMonoImageDownsampleType=/Bicubic',
        '-dMonoImageResolution=150',
      ],
    });
  }

  return profiles;
}

function runGs(exe, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolve({ ok: true });
      return reject(new Error(stderr || `Ghostscript failed with code ${code}`));
    });
  });
}

async function compressPdfBestEffort(inputPath) {
  const maxBytes = getMaxBytes();

  const stat = await fs.promises.stat(inputPath);
  if (stat.size <= maxBytes) {
    return { path: inputPath, size: stat.size, compressed: false };
  }

  const candidates = getGhostscriptCandidates();
  const profiles = getCompressionProfiles();

  let lastErr = null;
  let best = null; // { path, size }
  const createdPaths = [];

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const outPath = path.join(
      os.tmpdir(),
      `noteflow_compressed_${Date.now()}_${i}_${path.basename(inputPath)}`
    );
    createdPaths.push(outPath);

    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${profile.quality}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      ...profile.extraArgs,
      `-sOutputFile=${outPath}`,
      inputPath,
    ];

    for (const exe of candidates) {
      try {
        await runGs(exe, args);
        const outStat = await fs.promises.stat(outPath);

        // Track best result even if still above the target.
        if (!best || outStat.size < best.size) {
          best = { path: outPath, size: outStat.size };
        }

        // If we reached the target, stop early.
        if (outStat.size <= maxBytes) {
          // Cleanup other created files (except the chosen one)
          await Promise.all(
            createdPaths
              .filter((p) => p !== outPath)
              .map(async (p) => {
                try {
                  await fs.promises.unlink(p);
                } catch (e) {
                  // ignore
                }
              })
          );
          return { path: outPath, size: outStat.size, compressed: true };
        }

        // This exe worked; move to next (more aggressive) profile.
        break;
      } catch (e) {
        lastErr = e;
        // try next exe
      }
    }
  }

  // If we produced something smaller, return it (caller can decide whether to reject).
  if (best) {
    await Promise.all(
      createdPaths
        .filter((p) => p !== best.path)
        .map(async (p) => {
          try {
            await fs.promises.unlink(p);
          } catch (e) {
            // ignore
          }
        })
    );
    return { path: best.path, size: best.size, compressed: true };
  }

  // Cleanup if created
  await Promise.all(
    createdPaths.map(async (p) => {
      try {
        await fs.promises.unlink(p);
      } catch (e) {
        // ignore
      }
    })
  );

  const err = new Error(
    'Unable to compress PDF automatically (Ghostscript not available or failed). ' +
      'Install Ghostscript (Windows: gswin64c) or set GHOSTSCRIPT_PATH.'
  );
  err.cause = lastErr;
  throw err;
}

module.exports = { compressPdfBestEffort, getMaxBytes };
