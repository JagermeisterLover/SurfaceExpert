/**
 * Localization constants for SurfaceExpert
 * Supported locales: en (English), ru (Russian)
 */

export const locales = {
  en: {
    // Application
    appName: 'SurfaceExpert',

    // Menu Bar
    menu: {
      file: 'File',
      reports: 'Reports',
      view: 'View',
      tools: 'Tools',
      help: 'Help',

      // File menu
      importZMX: 'Import from ZMX...',

      // Reports menu
      exportHTMLReport: 'Export HTML Report...',
      exportPDFReport: 'Export PDF Report...',

      // View menu
      reload: 'Reload',
      toggleDevTools: 'Toggle DevTools',
      toggleFullscreen: 'Toggle Fullscreen',

      // Tools menu
      settings: 'Settings...',

      // Help menu
      documentation: 'Documentation',
      about: 'About',
      checkForUpdates: 'Check for Updates'
    },

    // Settings Dialog
    settings: {
      title: 'Settings',
      colorTheme: 'Color Theme',
      plotColorscale: 'Plot Colorscale',
      referenceWavelength: 'Reference Wavelength (nm)',
      wavelengthHelp: 'Used for RMS/P-V error calculations (default: 632.8 nm HeNe laser)',
      fastConvertThreshold: 'Fast Convert Max Deviation Threshold',
      fastConvertThresholdHelp: 'Maximum sag deviation for automatic Poly conversion (mm). Default: 0.000001',
      gridSize3D: '3D Plot Grid Size',
      gridSize3DHelp: 'Grid resolution for 3D surface plots',
      gridSize2D: '2D Plot Grid Size',
      gridSize2DHelp: 'Grid resolution for 2D heatmap plots with image-based rendering',
      language: 'Language',
      points: 'points',
      close: 'Close'
    },

    // Properties Panel
    properties: {
      title: 'Properties',
      noSurfaceSelected: 'No surface selected',
      basic: 'Basic',
      name: 'Name',
      type: 'Type',
      color: 'Color',
      universalParameters: 'Universal Parameters',
      surfaceSpecificParameters: 'Surface-Specific Parameters',
      calculatedMetrics: 'Calculated Metrics',

      // Actions
      actions: 'Actions',
      exportHTML: 'Export HTML',
      exportPDF: 'Export PDF',
      invert: 'Invert',
      normalize: 'Normalize Un Z',
      convertToUnZ: 'Convert to Un Z',
      convertToPoly: 'Convert to Poly',

      // Metrics
      paraxialFNum: 'Paraxial F/#',
      workingFNum: 'Working F/#',
      maxSag: 'Max Sag',
      maxSlope: 'Max Slope',
      maxAngle: 'Max Angle',
      maxAsphericity: 'Max Asphericity',
      maxAsphGradient: 'Max Asph Gradient',
      maxAberration: 'Max Aberration',
      bestFitSphere: 'Best Fit Sphere',
      rmsError: 'RMS Error',
      pvError: 'P-V Error'
    },

    // Surfaces Panel
    surfaces: {
      title: 'Surfaces',
      newFolder: 'New Folder',
      newSurface: 'New Surface',

      // Context menu
      addSurface: 'Add Surface',
      addFolder: 'Add Subfolder',
      rename: 'Rename',
      delete: 'Delete',
      deleteSurface: 'Delete Surface',
      deleteFolder: 'Delete Folder',

      // Prompts
      enterFolderName: 'Enter folder name:',
      enterNewFolderName: 'Enter new folder name:',
      enterNewSurfaceName: 'Enter new surface name:',
      confirmDeleteFolder: 'Are you sure you want to delete this folder and all its contents?',
      confirmDeleteSurface: 'Are you sure you want to delete this surface?'
    },

    // Visualization Panel
    visualization: {
      tabs: {
        summary: 'Summary',
        sag: 'Sag',
        slope: 'Slope',
        angle: 'Angle',
        asphericity: 'Asphericity',
        aberration: 'Aberration',
        data: 'Data'
      },

      subtabs: {
        '3d': '3D',
        '2d': '2D',
        crossSection: 'Cross-Section'
      },

      // Plot labels
      radialCoordinate: 'Radial Coordinate (mm)',
      sagMm: 'Sag (mm)',
      slopeRad: 'Slope (rad)',
      angleDeg: 'Angle (°)',
      asphericityMm: 'Asphericity (mm)',
      aberrationMm: 'Aberration (mm)',
      heightRange: 'Height Range'
    },

    // Surface Types
    surfaceTypes: {
      'Sphere': 'Sphere',
      'Even Asphere': 'Even Asphere',
      'Odd Asphere': 'Odd Asphere',
      'Zernike': 'Zernike',
      'Irregular': 'Irregular',
      'Opal Un U': 'Opal Un U',
      'Opal Un Z': 'Opal Un Z',
      'Poly': 'Poly'
    },

    // Surface Parameters (these are technical and might not need translation, but included for completeness)
    parameters: {
      'Radius': 'Radius',
      'Min Height': 'Min Height',
      'Max Height': 'Max Height',
      'Step': 'Step',
      'Conic Constant': 'Conic Constant',
      'Extrapolate': 'Extrapolate',
      'Norm Radius': 'Norm Radius',
      'Number of Terms': 'Number of Terms',
      'Decenter X': 'Decenter X',
      'Decenter Y': 'Decenter Y',
      'Tilt X': 'Tilt X',
      'Tilt Y': 'Tilt Y',
      'Spherical': 'Spherical',
      'Astigmatism': 'Astigmatism',
      'Coma': 'Coma',
      'Angle': 'Angle',
      'Scan Angle': 'Scan Angle',
      'X Coordinate': 'X Coordinate',
      'Y Coordinate': 'Y Coordinate'
    },

    // Dialogs
    dialogs: {
      // ZMX Import Dialog
      zmxImport: {
        title: 'Import Surfaces from ZMX',
        foundSurfaces: 'Found {count} surface(s). Select surfaces to import:',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        import: 'Import',
        importButton: 'Import {count} Surface(s)',
        cancel: 'Cancel',
        select: 'Select',
        surface: 'Surface',
        type: 'Type',
        radius: 'Radius (mm)',
        diameter: 'Diameter (mm)',
        conic: 'Conic',
        params: 'Params',
        errorNoSelection: 'Please select at least one surface to import'
      },

      // Conversion Dialog
      conversion: {
        title: 'Convert Surface',
        convertingFrom: 'Converting from',
        to: 'to',
        targetH: 'Target H value',
        convert: 'Convert',
        cancel: 'Cancel',
        converting: 'Converting...',
        optimizationAlgorithm: 'Optimization Algorithm',
        targetSurfaceType: 'Target Surface Type',
        radiusFixed: 'Radius (mm) - Fixed',
        conicConstantVariable: 'Conic Constant (Variable)',
        fixedConicValue: 'Fixed conic constant value',
        e2ParameterVariable: 'e2 Parameter (Variable)',
        fixedE2Value: 'Fixed e2 value',
        normalizationFactorH: 'Normalization Factor H',
        useHigherOrderCoeffs: 'Use Higher Order Coefficients',
        numberOfCoeffs: 'Number of Coefficients',
        algorithms: {
          leastsq: 'Least Squares (Levenberg-Marquardt)',
          least_squares: 'Least Squares (Trust Region)',
          nelder: 'Nelder-Mead',
          powell: 'Powell'
        }
      },

      // Conversion Results Dialog
      conversionResults: {
        title: 'Conversion Results',
        conversionSuccessful: 'Conversion Successful',
        originalParameters: 'Original Parameters',
        convertedParameters: 'Converted Parameters',
        metric: 'Metric',
        value: 'Value',
        maxSagDeviation: 'Max Sag Deviation',
        saveResults: 'Save results to text files',
        viewResults: 'View Results',
        addToSurfaces: 'Add to Surfaces',
        detailedResults: 'Detailed Fit Results',
        fitReport: 'Fit Report',
        fitMetrics: 'Fit Metrics',
        fitDeviations: 'Fit Deviations',
        rmse: 'RMSE',
        rSquared: 'R²',
        aic: 'AIC',
        bic: 'BIC',
        chiSquare: 'Chi-square',
        ok: 'OK'
      },

      // Normalize Un Z Dialog
      normalizeUnZ: {
        title: 'Normalize Un Z Surface',
        currentH: 'Current H',
        newH: 'New H value',
        normalize: 'Normalize',
        cancel: 'Cancel',
        help: 'This will renormalize the Opal Un Z surface to a new H value while preserving the surface shape.',
        errorPositive: 'Please enter a positive number',
        errorDifferent: 'New H value must be different from current H'
      },

      // About Dialog
      about: {
        title: 'About SurfaceExpert',
        version: 'Version',
        description: 'Optical surface analysis and visualization tool',
        copyright: 'Copyright © 2024',
        ok: 'OK'
      },

      // Input Dialog
      input: {
        ok: 'OK',
        cancel: 'Cancel'
      },

      // Context Menu
      contextMenu: {
        rename: 'Rename',
        renameFolder: 'Rename Folder',
        deleteFolder: 'Delete Folder',
        deleteSurface: 'Delete Surface'
      },

      // Folder Dialogs
      folder: {
        newFolder: 'New Folder',
        folderNameEmpty: 'Folder name cannot be empty',
        folderExists: 'A folder with this name already exists'
      }
    },

    // Summary View
    summary: {
      title: 'Surface Summary',
      surfaceType: 'Surface Type',
      parameters: 'Parameters',
      detailedAnalysis: 'Detailed Analysis',
      radiusMm: 'Radius (mm)',
      minHeightMm: 'Min Height (mm)',
      maxHeightMm: 'Max Height (mm)',
      stepMm: 'Step (mm)',
      heightRange: 'Height Range',

      // Analysis headers
      analysisHeaders: {
        radius: 'Radius',
        sag: 'Sag',
        slope: 'Slope',
        angle: 'Angle',
        asphericity: 'Asphericity',
        aberration: 'Aberration'
      },

      units: {
        mm: 'mm',
        rad: 'rad',
        deg: '°',
        perMm: '/mm'
      },

      // Table headers
      tableHeaders: {
        property: 'Property',
        value: 'Value',
        unit: 'Unit',
        coordinate: 'Coordinate',
        xCoordinate: 'X Coordinate',
        yCoordinate: 'Y Coordinate',
        sagAtXY: 'Sag at (X, Y)'
      }
    },

    // Data View
    dataView: {
      title: 'Calculated Data',
      radius: 'Radius (mm)',
      value: 'Value'
    },

    // Reports
    reports: {
      title: 'Surface Analysis Report',
      surfaceEquation: 'Surface Equation',
      surfaceParameters: 'Surface Parameters',
      summaryMetrics: 'Summary Metrics',
      surfaceType: 'Surface Type',
      calculatedData: 'Calculated Data',
      visualizations: 'Visualizations',
      radius: 'Radius',
      sag: 'Sag',
      slope: 'Slope',
      angle: 'Angle',
      angleDMS: 'Angle (DMS)',
      asphericity: 'Asphericity',
      aberration: 'Aberration',
      parameter: 'Parameter',
      value: 'Value',
      unit: 'Unit',
      metric: 'Metric',

      // Plot titles
      plot3D: '3D Surface Plot',
      plot2D: '2D Heatmap',
      plotSag: 'Sag vs Radial Coordinate',
      plotSlope: 'Slope vs Radial Coordinate',
      plotAsphericity: 'Asphericity vs Radial Coordinate',
      plotAberration: 'Aberration vs Radial Coordinate'
    },

    // Messages
    messages: {
      selectSurfaceFirst: 'Please select a surface first',
      noDataAvailable: 'No data available',
      calculationError: 'Error calculating values',
      invalidParameters: 'Invalid parameters',
      operationSuccessful: 'Operation completed successfully',
      operationFailed: 'Operation failed'
    },

    // Buttons
    buttons: {
      ok: 'OK',
      cancel: 'Cancel',
      close: 'Close',
      save: 'Save',
      apply: 'Apply',
      delete: 'Delete',
      add: 'Add',
      remove: 'Remove',
      import: 'Import',
      export: 'Export',
      convert: 'Convert',
      fastConvertToPoly: 'Fast Convert to Poly',
      normalize: 'Normalize'
    },

    // Update Notification
    update: {
      title: 'Update Available',
      currentVersion: 'Current',
      latestVersion: 'Latest',
      download: 'Download',
      releaseNotes: 'Release Notes',
      noUpdates: 'You are using the latest version!',
      checkError: 'Failed to check for updates. Please try again later.',
      badgeText: 'Update available'
    }
  },

  ru: {
    // Приложение
    appName: 'SurfaceExpert',

    // Меню
    menu: {
      file: 'Файл',
      reports: 'Отчёты',
      view: 'Вид',
      tools: 'Инструменты',
      help: 'Справка',

      // Меню Файл
      importZMX: 'Импорт из ZMX...',

      // Меню Отчёты
      exportHTMLReport: 'Экспорт HTML отчёта...',
      exportPDFReport: 'Экспорт PDF отчёта...',

      // Меню Вид
      reload: 'Обновить',
      toggleDevTools: 'Инструменты разработчика',
      toggleFullscreen: 'Полноэкранный режим',

      // Меню Инструменты
      settings: 'Настройки...',

      // Меню Справка
      documentation: 'Документация',
      about: 'О программе',
      checkForUpdates: 'Проверить обновления'
    },

    // Диалог настроек
    settings: {
      title: 'Настройки',
      colorTheme: 'Цветовая тема',
      plotColorscale: 'Цветовая шкала графиков',
      referenceWavelength: 'Опорная длина волны (нм)',
      wavelengthHelp: 'Используется для расчётов ошибок RMS/P-V (по умолчанию: 632.8 нм HeNe лазер)',
      fastConvertThreshold: 'Порог максимального отклонения для быстрой конвертации',
      fastConvertThresholdHelp: 'Максимальное отклонение прогиба для автоматической конвертации в Poly (мм). По умолчанию: 0.000001',
      gridSize3D: 'Размер сетки 3D графика',
      gridSize3DHelp: 'Разрешение сетки для 3D графиков поверхностей',
      gridSize2D: 'Размер сетки 2D графика',
      gridSize2DHelp: 'Разрешение сетки для 2D тепловых карт с растровой визуализацией',
      language: 'Язык',
      points: 'точек',
      close: 'Закрыть'
    },

    // Панель свойств
    properties: {
      title: 'Свойства',
      noSurfaceSelected: 'Поверхность не выбрана',
      basic: 'Основные',
      name: 'Название',
      type: 'Тип',
      color: 'Цвет',
      universalParameters: 'Универсальные параметры',
      surfaceSpecificParameters: 'Специфические параметры',
      calculatedMetrics: 'Вычисленные метрики',

      // Действия
      actions: 'Действия',
      exportHTML: 'Экспорт HTML',
      exportPDF: 'Экспорт PDF',
      invert: 'Инвертировать',
      normalize: 'Нормализовать H',
      convertToUnZ: 'Конвертировать в Универсальное от Z',
      convertToPoly: 'Конвертировать в Полином',

      // Метрики
      paraxialFNum: 'Параксиальное F/#',
      workingFNum: 'Рабочее F/#',
      maxSag: 'Макс. стрелка прогиба',
      maxSlope: 'Макс. крутизна',
      maxAngle: 'Макс. угол',
      maxAsphericity: 'Макс. асферичность',
      maxAsphGradient: 'Макс. градиент асферичности',
      maxAberration: 'Макс. аберрация нормали',
      bestFitSphere: 'Ближайшая сфера сравнения',
      rmsError: 'Ошибка RMS',
      pvError: 'Ошибка P-V'
    },

    // Панель поверхностей
    surfaces: {
      title: 'Поверхности',
      newFolder: 'Новая папка',
      newSurface: 'Новая поверхность',

      // Контекстное меню
      addSurface: 'Добавить поверхность',
      addFolder: 'Добавить подпапку',
      rename: 'Переименовать',
      delete: 'Удалить',
      deleteSurface: 'Удалить поверхность',
      deleteFolder: 'Удалить папку',

      // Запросы
      enterFolderName: 'Введите название папки:',
      enterNewFolderName: 'Введите новое название папки:',
      enterNewSurfaceName: 'Введите новое название поверхности:',
      confirmDeleteFolder: 'Вы уверены, что хотите удалить эту папку и всё её содержимое?',
      confirmDeleteSurface: 'Вы уверены, что хотите удалить эту поверхность?'
    },

    // Панель визуализации
    visualization: {
      tabs: {
        summary: 'Сводка',
        sag: 'Стрелка прогиба',
        slope: 'Крутизна',
        angle: 'Угол',
        asphericity: 'Асферичность',
        aberration: 'Аберрация нормали',
        data: 'Данные'
      },

      subtabs: {
        '3d': '3D',
        '2d': '2D',
        crossSection: 'Сечение'
      },

      // Подписи графиков
      radialCoordinate: 'Радиальная координата (мм)',
      sagMm: 'Стрелка прогиба (мм)',
      slopeRad: 'Крутизна (рад)',
      angleDeg: 'Угол (°)',
      asphericityMm: 'Асферичность (мм)',
      aberrationMm: 'Аберрация нормали (мм)',
      heightRange: 'Диапазон высот'
    },

    // Типы поверхностей
    surfaceTypes: {
      'Sphere': 'Сфера',
      'Even Asphere': 'Четная асферика',
      'Odd Asphere': 'Нечетная асферика',
      'Zernike': 'Цернике',
      'Irregular': 'Irregular',
      'Opal Un U': 'Универсальное от U',
      'Opal Un Z': 'Универсальное от Z',
      'Poly': 'Полином'
    },

    // Параметры поверхности
    parameters: {
      'Radius': 'Радиус',
      'Min Height': 'Мин. высота',
      'Max Height': 'Макс. высота',
      'Step': 'Шаг',
      'Conic Constant': 'Коническая константа',
      'Extrapolate': 'Экстраполировать?',
      'Norm Radius': 'Норм. радиус',
      'Number of Terms': 'Количество коэффициентов Цернике',
      'Decenter X': 'Смещение X',
      'Decenter Y': 'Смещение Y',
      'Tilt X': 'Наклон X',
      'Tilt Y': 'Наклон Y',
      'Spherical': 'Сферическая',
      'Astigmatism': 'Астигматизм',
      'Coma': 'Кома',
      'Angle': 'Угол',
      'Scan Angle': 'Угол сканирования',
      'X Coordinate': 'X координата',
      'Y Coordinate': 'Y координата'
    },

    // Диалоги
    dialogs: {
      // Диалог импорта ZMX
      zmxImport: {
        title: 'Импорт поверхностей из ZMX',
        foundSurfaces: 'Найдено поверхностей: {count}. Выберите поверхности для импорта:',
        selectAll: 'Выбрать все',
        deselectAll: 'Снять выбор',
        import: 'Импорт',
        importButton: 'Импорт ({count})',
        cancel: 'Отмена',
        select: 'Выбор',
        surface: 'Поверхность',
        type: 'Тип',
        radius: 'Радиус (мм)',
        diameter: 'Диаметр (мм)',
        conic: 'Коника',
        params: 'Парам.',
        errorNoSelection: 'Пожалуйста, выберите хотя бы одну поверхность для импорта'
      },

      // Диалог конвертации
      conversion: {
        title: 'Конвертировать поверхность',
        convertingFrom: 'Конвертация из',
        to: 'в',
        targetH: 'Целевое значение H',
        convert: 'Конвертировать',
        cancel: 'Отмена',
        converting: 'Конвертация...',
        optimizationAlgorithm: 'Алгоритм оптимизации',
        targetSurfaceType: 'Целевой тип поверхности',
        radiusFixed: 'Радиус (мм) - Фиксированный',
        conicConstantVariable: 'Коническая константа (Переменная)',
        fixedConicValue: 'Фиксированное значение конической константы',
        e2ParameterVariable: 'Параметр e2 (Переменный)',
        fixedE2Value: 'Фиксированное значение e2',
        normalizationFactorH: 'Фактор нормализации H',
        useHigherOrderCoeffs: 'Использовать коэффициенты высших порядков',
        numberOfCoeffs: 'Количество коэффициентов',
        algorithms: {
          leastsq: 'Наименьшие квадраты (Левенберг-Марквардт)',
          least_squares: 'Наименьшие квадраты (Trust Region)',
          nelder: 'Нелдер-Мид',
          powell: 'Пауэлл'
        }
      },

      // Диалог результатов конвертации
      conversionResults: {
        title: 'Результаты конвертации',
        conversionSuccessful: 'Конвертация выполнена успешно',
        originalParameters: 'Исходные параметры',
        convertedParameters: 'Конвертированные параметры',
        metric: 'Метрика',
        value: 'Значение',
        maxSagDeviation: 'Макс. отклонение стрелки прогиба',
        saveResults: 'Сохранить результаты в текстовые файлы',
        viewResults: 'Просмотр результатов',
        addToSurfaces: 'Добавить к поверхностям',
        detailedResults: 'Детальные результаты подгонки',
        fitReport: 'Отчёт о подгонке',
        fitMetrics: 'Метрики подгонки',
        fitDeviations: 'Отклонения подгонки',
        rmse: 'RMSE',
        rSquared: 'R²',
        aic: 'AIC',
        bic: 'BIC',
        chiSquare: 'Хи-квадрат',
        ok: 'ОК'
      },

      // Диалог нормализации Un Z
      normalizeUnZ: {
        title: 'Нормализация поверхности Un Z',
        currentH: 'Текущее H',
        newH: 'Новое значение H',
        normalize: 'Нормализовать',
        cancel: 'Отмена',
        help: 'Это перенормирует Универсальную от Z поверхность на новое значение H с сохранением формы поверхности.',
        errorPositive: 'Пожалуйста, введите положительное число',
        errorDifferent: 'Новое значение H должно отличаться от текущего H'
      },

      // Диалог О программе
      about: {
        title: 'О программе SurfaceExpert',
        version: 'Версия',
        description: 'Инструмент для анализа и визуализации оптических поверхностей',
        copyright: 'Авторские права © 2024',
        ok: 'ОК'
      },

      // Диалог ввода
      input: {
        ok: 'ОК',
        cancel: 'Отмена'
      },

      // Контекстное меню
      contextMenu: {
        rename: 'Переименовать',
        renameFolder: 'Переименовать папку',
        deleteFolder: 'Удалить папку',
        deleteSurface: 'Удалить поверхность'
      },

      // Диалоги папок
      folder: {
        newFolder: 'Новая папка',
        folderNameEmpty: 'Имя папки не может быть пустым',
        folderExists: 'Папка с таким именем уже существует'
      }
    },

    // Сводная информация
    summary: {
      title: 'Сводка по поверхности',
      surfaceType: 'Тип поверхности',
      parameters: 'Параметры',
      detailedAnalysis: 'Детальный анализ',
      radiusMm: 'Радиус (мм)',
      minHeightMm: 'Мин. высота (мм)',
      maxHeightMm: 'Макс. высота (мм)',
      stepMm: 'Шаг (мм)',
      heightRange: 'Диапазон высот',

      // Заголовки анализа
      analysisHeaders: {
        radius: 'Радиус',
        sag: 'Стрелка прогиба',
        slope: 'Крутизна',
        angle: 'Угол',
        asphericity: 'Асферичность',
        aberration: 'Аберрация нормали'
      },

      units: {
        mm: 'мм',
        rad: 'рад',
        deg: '°',
        perMm: '/мм'
      },

      // Заголовки таблиц
      tableHeaders: {
        property: 'Параметр',
        value: 'Значение',
        unit: 'Единица',
        coordinate: 'Координата',
        xCoordinate: 'Координата X',
        yCoordinate: 'Координата Y',
        sagAtXY: 'Стрелка прогиба в точке (X, Y)'
      }
    },

    // Просмотр данных
    dataView: {
      title: 'Вычисленные данные',
      radius: 'Радиус (мм)',
      value: 'Значение'
    },

    // Отчеты
    reports: {
      title: 'Отчет по анализу поверхности',
      surfaceEquation: 'Уравнение поверхности',
      surfaceParameters: 'Параметры поверхности',
      summaryMetrics: 'Сводка',
      surfaceType: 'Тип поверхности',
      calculatedData: 'Вычисленные данные',
      visualizations: 'Графики',
      radius: 'Радиус',
      sag: 'Стрелка прогиба',
      slope: 'Крутизна',
      angle: 'Угол',
      angleDMS: 'Угол (DMS)',
      asphericity: 'Асферичность',
      aberration: 'Аберрация нормали',
      parameter: 'Параметр',
      value: 'Значение',
      unit: 'Единица',
      metric: 'Свойство',

      // Названия графиков
      plot3D: '3D график поверхности',
      plot2D: '2D heatmap',
      plotSag: 'Зависимость стрелки прогиба от радиальной координаты',
      plotSlope: 'Зависимость крутизны от радиальной координаты',
      plotAsphericity: 'Зависимость асферичности от радиальной координаты',
      plotAberration: 'Зависимость аберраций нормали от радиальной координаты'
    },

    // Сообщения
    messages: {
      selectSurfaceFirst: 'Пожалуйста, сначала выберите поверхность',
      noDataAvailable: 'Данные недоступны',
      calculationError: 'Ошибка вычисления значений',
      invalidParameters: 'Неверные параметры',
      operationSuccessful: 'Операция выполнена успешно',
      operationFailed: 'Операция не удалась'
    },

    // Кнопки
    buttons: {
      ok: 'ОК',
      cancel: 'Отмена',
      close: 'Закрыть',
      save: 'Сохранить',
      apply: 'Применить',
      delete: 'Удалить',
      add: 'Добавить',
      remove: 'Удалить',
      import: 'Импорт',
      export: 'Экспорт',
      convert: 'Конвертировать',
      normalize: 'Нормализовать',
      fastConvertToPoly: 'Быстрая конвертация в Poly'
    },

    // Уведомление об обновлении
    update: {
      title: 'Доступно обновление',
      currentVersion: 'Текущая',
      latestVersion: 'Новая',
      download: 'Скачать',
      releaseNotes: 'Описание',
      noUpdates: 'Вы используете последнюю версию!',
      checkError: 'Не удалось проверить обновления. Попробуйте позже.',
      badgeText: 'Доступно обновление'
    }
  }
};

// Available locales
export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' }
];

// Get locale strings for a given locale code
export function getLocale(localeCode = 'en') {
  return locales[localeCode] || locales.en;
}

// Get current locale from localStorage or default to English
export function getCurrentLocale() {
  try {
    return localStorage.getItem('surfaceexpert-locale') || 'en';
  } catch {
    return 'en';
  }
}

// Save locale to localStorage
export function saveLocale(localeCode) {
  try {
    localStorage.setItem('surfaceexpert-locale', localeCode);
  } catch (e) {
    console.warn('Failed to save locale to localStorage:', e);
  }
}
