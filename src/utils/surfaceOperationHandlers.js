// ============================================
// Surface Operation Handlers
// ============================================
// Business logic for surface transformation operations

import { normalizeUnZ, convertPolyToUnZ, convertUnZToPoly, invertSurface } from './surfaceTransformations.js';

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
        const currentH = parseFloat(selectedSurface.parameters.H) || 1;
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
