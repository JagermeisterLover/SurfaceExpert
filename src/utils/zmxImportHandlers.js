// ============================================
// ZMX Import Handlers
// ============================================
// Business logic for importing Zemax ZMX files

/**
 * Handle ZMX file import - open dialog and parse file
 * @param {Function} setZmxSurfaces - State setter for parsed surfaces
 * @param {Function} setShowZMXImport - State setter for import dialog visibility
 * @returns {Promise<void>}
 */
export const handleZMXImport = async (setZmxSurfaces, setShowZMXImport) => {
    if (!window.electronAPI || !window.electronAPI.openZMXDialog) {
        alert('File dialog not available');
        return;
    }

    const result = await window.electronAPI.openZMXDialog();

    if (result.canceled) {
        if (result.error) {
            alert('Error opening file: ' + result.error);
        }
        return;
    }

    try {
        const parsedSurfaces = window.ZMXParser.parse(result.content);
        setZmxSurfaces(parsedSurfaces);
        setShowZMXImport(true);
    } catch (error) {
        alert('Error parsing ZMX file: ' + error.message);
    }
};

/**
 * Generate unique surface name to avoid conflicts
 * @param {string} baseName - Base name for the surface
 * @param {Array} allSurfaces - Array of all existing surfaces
 * @returns {string} Unique surface name
 */
const getUniqueSurfaceName = (baseName, allSurfaces) => {
    const existingNames = new Set(allSurfaces.map(s => s.name));
    if (!existingNames.has(baseName)) return baseName;

    let counter = 1;
    let newName = `${baseName} (${counter})`;
    while (existingNames.has(newName)) {
        counter++;
        newName = `${baseName} (${counter})`;
    }
    return newName;
};

/**
 * Import selected surfaces from ZMX file into current folder
 * @param {Array<number>} selectedIndices - Indices of surfaces to import
 * @param {Array} zmxSurfaces - Parsed ZMX surfaces
 * @param {Array} folders - Current folder structure
 * @param {Object} selectedFolder - Currently selected folder
 * @param {Function} setFolders - State setter for folders
 * @param {Function} setSelectedFolder - State setter for selected folder
 * @param {Function} setSelectedSurface - State setter for selected surface
 * @param {Function} setShowZMXImport - State setter for import dialog visibility
 */
export const importSelectedSurfaces = async (
    selectedIndices,
    zmxSurfaces,
    folders,
    selectedFolder,
    setFolders,
    setSelectedFolder,
    setSelectedSurface,
    setShowZMXImport
) => {
    // If no folder exists, create a default one
    let targetFolder = selectedFolder;
    let currentFolders = folders;

    if (!targetFolder) {
        const defaultFolder = {
            id: 'default',
            name: 'My Surfaces',
            expanded: true,
            surfaces: []
        };
        currentFolders = [defaultFolder];
        targetFolder = defaultFolder;
    }

    const colorOptions = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
    const allSurfaces = currentFolders.flatMap(f => f.surfaces);
    let nextId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;

    const newSurfaces = selectedIndices.map((index, i) => {
        const zmxSurface = zmxSurfaces[index];
        const color = colorOptions[(nextId + i) % colorOptions.length];
        const surface = window.ZMXParser.convertToAppSurface(zmxSurface, nextId + i, color);

        // Ensure unique name
        surface.name = getUniqueSurfaceName(surface.name, allSurfaces);
        return surface;
    });

    // Save all imported surfaces to disk
    if (window.electronAPI && window.electronAPI.saveSurface) {
        for (const surface of newSurfaces) {
            await window.electronAPI.saveSurface(targetFolder.name, surface);
        }
    }

    const updated = currentFolders.map(f =>
        f.id === targetFolder.id
            ? { ...f, surfaces: [...f.surfaces, ...newSurfaces] }
            : f
    );
    setFolders(updated);
    setSelectedFolder(targetFolder);
    setShowZMXImport(false);

    if (newSurfaces.length > 0) {
        setSelectedSurface(newSurfaces[0]);
    }
};
