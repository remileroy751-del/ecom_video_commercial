; Mémorise la langue choisie dans l'installateur (Français / English) pour que le logiciel démarre dans cette langue.
!macro customInstall
  Push $0
  FileOpen $0 "$INSTDIR\language.txt" w
  FileWrite $0 "$LANGUAGE"
  FileClose $0
  Pop $0
!macroend
