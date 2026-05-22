# Volver a la interfaz anterior

## Opción 1 (recomendada): botón en la app

En la barra superior hay **"Interfaz clásica"**. Al hacer clic, la app recarga con la UI anterior.

Para volver a la nueva: **"Interfaz nueva"**.

## Opción 2: manual

Copiá estos archivos sobre los de `components/`:

```powershell
cd frontend-figma\frontend\src\app\components
Copy-Item legacy\TicketsList.classic.tsx TicketsList.tsx -Force
Copy-Item legacy\CreateTicket.classic.tsx CreateTicket.tsx -Force
Copy-Item legacy\Dashboard.classic.tsx Dashboard.tsx -Force
```

Luego en `App.tsx` quitá la lógica de `ui-mode` si la agregaste.

## Archivos de respaldo

- `TicketsList.classic.tsx`
- `CreateTicket.classic.tsx`
- `Dashboard.classic.tsx`
