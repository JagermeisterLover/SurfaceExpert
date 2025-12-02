; Custom NSIS script to ensure shortcuts use the correct icon
; This script is included during NSIS installer build process

!macro customInstall
  ; Create shortcuts with explicit icon from the executable
  ${ifNot} ${isUpdated}
    ; Desktop shortcut with icon from exe
    CreateShortCut "$DESKTOP\SurfaceExpert.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 SW_SHOWNORMAL

    ; Start Menu shortcut with icon from exe
    CreateDirectory "$SMPROGRAMS\SurfaceExpert"
    CreateShortCut "$SMPROGRAMS\SurfaceExpert\SurfaceExpert.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 SW_SHOWNORMAL
  ${endIf}
!macroend
