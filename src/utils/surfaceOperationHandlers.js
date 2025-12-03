// ============================================
// Surface Operation Handlers
// ============================================
// Business logic for surface transformation operations

import { normalizeUnZ, convertPolyToUnZ, convertUnZToPoly, invertSurface } from './surfaceTransformations.js';
import { parseNumber } from './numberParsing.js';
import { calculateSurfaceValues } from './calculations.js';

/**
 * Handle surface inversion (flip concave/convex)
 * @param {Object} selectedSurface - Currently selected surface
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Array} folders - All folders
 * @param {Function} setFolders - State setter for folders
 */
export const handleInvertSurface = (selectedSurface, selectedFolder, folders, setFolders) => {
    if (!selectedSurface || !selectedFolder) return;

    try {
        const invertedParams = invertSurface(selectedSurface.type, selectedSurface.parameters);

        // Update the surface with inverted parameters
        const updatedFolders = folders.map(folder => {
            if (folder.id === selectedFolder.id) {
                return {
                    ...folder,
                    surfaces: folder.surfaces.map(s =>
                        s.id === selectedSurface.id
                            ? { ...s, parameters: invertedParams }
                            : s
                    )
                };
            }
            return folder;
        });

        setFolders(updatedFolders);

        // Save to disk
        const updatedSurface = { ...selectedSurface, parameters: invertedParams };
        if (window.electronAPI && window.electronAPI.saveSurface) {
            window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }
    } catch (error) {
        alert(`Error inverting surface: ${error.message}`);
        console.error('Invert error:', error);
    }
};

/**
 * Handle Opal Un Z normalization
 * @param {number} newH - New H value
 * @param {Object} selectedSurface - Currently selected surface
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Array} folders - All folders
 * @param {Function} setFolders - State setter for folders
 * @param {Function} setShowNormalizeUnZ - State setter for dialog visibility
 */
export const handleNormalizeUnZConfirm = (
    newH,
    selectedSurface,
    selectedFolder,
    folders,
    setFolders,
    setShowNormalizeUnZ
) => {
    if (!selectedSurface || !selectedFolder) return;

    try {
        const currentH = parseNumber(selectedSurface.parameters.H);
        const currentCoeffs = {};
        for (let n = 3; n <= 13; n++) {
            currentCoeffs[`A${n}`] = selectedSurface.parameters[`A${n}`];
        }

        const result = normalizeUnZ(newH, currentH, currentCoeffs);

        // Update parameters with normalized coefficients and new H
        const updatedParams = {
            ...selectedSurface.parameters,
            H: result.H.toString(),
            ...result.coefficients
        };

        // Update folders
        const updatedFolders = folders.map(folder => {
            if (folder.id === selectedFolder.id) {
                return {
                    ...folder,
                    surfaces: folder.surfaces.map(s =>
                        s.id === selectedSurface.id
                            ? { ...s, parameters: updatedParams }
                            : s
                    )
                };
            }
            return folder;
        });

        setFolders(updatedFolders);
        setShowNormalizeUnZ(false);

        // Save to disk
        const updatedSurface = { ...selectedSurface, parameters: updatedParams };
        if (window.electronAPI && window.electronAPI.saveSurface) {
            window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }
    } catch (error) {
        alert(`Error normalizing surface: ${error.message}`);
        console.error('Normalize error:', error);
    }
};

/**
 * Convert Poly surface to Opal Un Z
 * @param {Object} selectedSurface - Currently selected surface
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Array} folders - All folders
 * @param {Function} setFolders - State setter for folders
 * @param {Function} setSelectedSurface - State setter for selected surface
 */
export const handleConvertToUnZ = (
    selectedSurface,
    selectedFolder,
    folders,
    setFolders,
    setSelectedSurface
) => {
    if (!selectedSurface || selectedSurface.type !== 'Poly' || !selectedFolder) return;

    try {
        const unzParams = convertPolyToUnZ(selectedSurface.parameters);

        // Create new surface with UnZ type
        const newSurface = {
            id: Date.now(),
            name: `${selectedSurface.name} (UnZ)`,
            type: 'Opal Un Z',
            color: selectedSurface.color,
            parameters: {
                'Min Height': selectedSurface.parameters['Min Height'],
                'Max Height': selectedSurface.parameters['Max Height'],
                'Step': selectedSurface.parameters['Step'],
                ...unzParams
            }
        };

        // Add new surface to folder
        const updatedFolders = folders.map(folder => {
            if (folder.id === selectedFolder.id) {
                return {
                    ...folder,
                    surfaces: [...folder.surfaces, newSurface]
                };
            }
            return folder;
        });

        setFolders(updatedFolders);
        setSelectedSurface(newSurface);

        // Save to disk
        if (window.electronAPI && window.electronAPI.saveSurface) {
            window.electronAPI.saveSurface(selectedFolder.name, newSurface);
        }
    } catch (error) {
        alert(`Error converting to UnZ: ${error.message}`);
        console.error('Convert to UnZ error:', error);
    }
};

/**
 * Convert Opal Un Z surface to Poly
 * @param {Object} selectedSurface - Currently selected surface
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Array} folders - All folders
 * @param {Function} setFolders - State setter for folders
 * @param {Function} setSelectedSurface - State setter for selected surface
 */
export const handleConvertToPoly = (
    selectedSurface,
    selectedFolder,
    folders,
    setFolders,
    setSelectedSurface
) => {
    if (!selectedSurface || selectedSurface.type !== 'Opal Un Z' || !selectedFolder) return;

    try {
        const polyParams = convertUnZToPoly(selectedSurface.parameters);

        // Create new surface with Poly type
        const newSurface = {
            id: Date.now(),
            name: `${selectedSurface.name} (Poly)`,
            type: 'Poly',
            color: selectedSurface.color,
            parameters: {
                'Min Height': selectedSurface.parameters['Min Height'],
                'Max Height': selectedSurface.parameters['Max Height'],
                'Step': selectedSurface.parameters['Step'],
                ...polyParams
            }
        };

        // Add new surface to folder
        const updatedFolders = folders.map(folder => {
            if (folder.id === selectedFolder.id) {
                return {
                    ...folder,
                    surfaces: [...folder.surfaces, newSurface]
                };
            }
            return folder;
        });

        setFolders(updatedFolders);
        setSelectedSurface(newSurface);

        // Save to disk
        if (window.electronAPI && window.electronAPI.saveSurface) {
            window.electronAPI.saveSurface(selectedFolder.name, newSurface);
        }
    } catch (error) {
        alert(`Error converting to Poly: ${error.message}`);
        console.error('Convert to Poly error:', error);
    }
};

/**
 * Fast convert surface to Poly with iterative coefficient addition
 * Automatically adds higher order coefficients until max deviation threshold is met
 * @param {Object} selectedSurface - Currently selected surface
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Array} folders - All folders
 * @param {Function} setFolders - State setter for folders
 * @param {Function} setSelectedSurface - State setter for selected surface
 * @param {Function} setShowConvertResults - State setter for results dialog visibility
 * @param {Function} setConvertResults - State setter for conversion results
 * @param {number} maxDeviationThreshold - Maximum allowed deviation (default: 0.000001 mm)
 * @param {Function} setProgress - State setter for progress indicator (optional)
 */
export const handleFastConvertToPoly = async (
    selectedSurface,
    selectedFolder,
    folders,
    setFolders,
    setSelectedSurface,
    setShowConvertResults,
    setConvertResults,
    maxDeviationThreshold = 0.000001,
    setProgress = null
) => {
    if (!selectedSurface || !selectedFolder) return;

    if (!window.electronAPI || !window.electronAPI.runConversion) {
        alert('Conversion not available in this environment');
        return;
    }

    try {
        // Generate surface data points
        const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
        const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);
        const points = 100;
        const surfaceData = [];

        for (let i = 0; i <= points; i++) {
            const r = minHeight + (maxHeight - minHeight) * i / points;
            const values = calculateSurfaceValues(r, selectedSurface);
            surfaceData.push({ r, z: values.sag });
        }

        // Extract radius from surface parameters (use Radius or A1 depending on surface type)
        let radius;
        if (selectedSurface.parameters['Radius']) {
            radius = selectedSurface.parameters['Radius'];
        } else if (selectedSurface.parameters['A1']) {
            // For Poly surfaces, A1 = 2*R, so R = A1/2
            radius = String(parseNumber(selectedSurface.parameters['A1']) / 2);
        } else {
            radius = '100'; // Default fallback
        }

        // Start with A2 only (e2-1 term), then add A3, A4, etc.
        // In Python code: TermNumber=0 means A1+A2 only, TermNumber=1 means A1+A2+A3, etc.
        let numCoeffs = 0; // Start with A1 and A2 only (A2 = e2-1)
        let bestResult = null;
        const maxCoeffs = 11; // A3-A13 (11 terms for Poly Auto-Normalized)

        console.log(`Starting fast convert to Poly with threshold: ${maxDeviationThreshold} mm`);

        // Iteratively add coefficients until threshold is met or max coefficients reached
        while (numCoeffs <= maxCoeffs) {
            const coeffDesc = numCoeffs === 0 ? 'A1+A2' : `A1-A${2+numCoeffs}`;
            console.log(`Trying with ${coeffDesc}...`);

            // Update progress indicator
            if (setProgress) {
                setProgress(coeffDesc);
            }

            // Prepare conversion settings for Poly (Auto-Normalized) - type 6
            const settings = {
                SurfaceType: '6', // Poly (Auto-Normalized)
                Radius: radius,
                // Note: H is used by type 3/4 but not type 6 (auto-calculated as H_internal)
                // Pass '1.0' to avoid float conversion error in Python
                H: '1.0',
                e2_isVariable: '1', // e2 is variable
                e2: '1', // Initial value
                conic_isVariable: '0',
                conic: '0',
                TermNumber: String(numCoeffs),
                OptimizationAlgorithm: 'leastsq' // Fast default algorithm
            };

            // Call conversion via IPC
            const result = await window.electronAPI.runConversion(surfaceData, settings);

            if (result.success) {
                // Calculate max deviation from deviations data
                const maxDeviation = calculateMaxDeviation(result.deviations);
                const coeffDescResult = numCoeffs === 0 ? 'A1+A2 only' : `A1-A${2+numCoeffs}`;
                console.log(`  Max deviation with ${coeffDescResult}: ${maxDeviation.toExponential(6)} mm`);

                bestResult = result;

                // Check if we've met the threshold
                if (maxDeviation <= maxDeviationThreshold) {
                    console.log(`✓ Threshold met with ${coeffDescResult}!`);
                    break;
                }
            } else {
                const coeffDescError = numCoeffs === 0 ? 'A1+A2 only' : `A1-A${2+numCoeffs}`;
                console.error(`  Conversion failed with ${coeffDescError}:`, result.error);
                break;
            }

            numCoeffs++;
        }

        if (bestResult) {
            // Store result data including original surface info
            setConvertResults({
                ...bestResult,
                originalSurface: selectedSurface
            });
            setShowConvertResults(true);
        } else {
            alert('Fast conversion failed: No successful fit was achieved');
        }
    } catch (error) {
        alert('Fast conversion error: ' + error.message);
        console.error('Fast convert error:', error);
    } finally {
        // Reset progress indicator when done
        if (setProgress) {
            setProgress(null);
        }
    }
};

/**
 * Calculate maximum absolute deviation from deviations data
 * @param {string} deviations - Deviations text data from fit results
 * @returns {number} Maximum absolute deviation
 */
function calculateMaxDeviation(deviations) {
    if (!deviations) return 0;

    const lines = deviations.split('\n');
    let maxDev = 0;

    for (const line of lines) {
        if (line.trim() && !line.includes('Height')) { // Skip header
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
                const deviation = Math.abs(parseFloat(parts[3])); // 4th column is deviation
                if (!isNaN(deviation)) {
                    maxDev = Math.max(maxDev, deviation);
                }
            }
        }
    }

    return maxDev;
}
