import { Button, Tooltip } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import { isClassicUi, toggleUiMode } from './SupportShell';

export default function UiModeToggle() {
  const classic = isClassicUi();

  return (
    <Tooltip title={classic ? 'Probar interfaz nueva' : 'Volver a interfaz clásica'}>
      <Button
        size="small"
        color="inherit"
        startIcon={<PaletteIcon />}
        onClick={toggleUiMode}
        sx={{ mr: 0.5, textTransform: 'none' }}
      >
        {classic ? 'Interfaz nueva' : 'Interfaz clásica'}
      </Button>
    </Tooltip>
  );
}
