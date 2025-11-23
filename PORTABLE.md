# SurfaceExpert Portable Edition

## Data Storage

The portable version of SurfaceExpert stores all user data in a `SurfaceExpertData` folder next to the executable:

```
SurfaceExpert 2.1.0.exe    <- The portable executable
SurfaceExpertData/          <- All application data (created on first run)
  ├── surfaces/             <- Your saved surfaces (JSON files)
  │   └── My Surfaces/
  │       └── Surface1.json
  └── settings.json         <- Application settings (colorscale, wavelength, etc.)
```

### Features

- **Fully Portable**: Run from any location (USB drive, external disk, local folder)
- **No Installation**: Just copy and run
- **Self-Contained Data**: All surfaces and settings stored next to the exe
- **No Registry Changes**: Leaves no traces on the system

### First Run

On first launch, the application will automatically create:
1. `SurfaceExpertData/` folder next to the exe
2. `SurfaceExpertData/surfaces/` folder for storing surface data
3. `SurfaceExpertData/settings.json` with default settings

### Moving the Application

You can move the entire folder (exe + SurfaceExpertData folder) to any location and it will continue to work with all your saved data.

### Sharing Surfaces

To share surfaces with others:
1. Copy the `SurfaceExpertData/surfaces/` folder from your portable installation
2. Share it with another user
3. They can copy it to their `SurfaceExpertData/` folder

### Troubleshooting

If you encounter file permission errors:
- Make sure the exe is not in a read-only location (e.g., avoid Program Files)
- Run from a location where you have write permissions (Desktop, Documents, USB drive)

### Build Date
Generated: November 23, 2025
Version: 2.1.0
