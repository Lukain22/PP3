import { useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Container,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total', value: 24, color: '#111827' },
    { label: 'Abiertos', value: 8, color: '#b45309' },
    { label: 'En Proceso', value: 10, color: '#1d4ed8' },
    { label: 'Resueltos', value: 6, color: '#047857' }
  ];

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <AppBar position="static" color="primary" elevation={0} sx={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexGrow: 1, minWidth: 0 }}>
            <Box
              component="img"
              alt="Logo"
              src="/logo-itb.png"
              sx={{
                height: 28,
                width: 28,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.92)',
                p: 0.5
              }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Soporte Técnico
            </Typography>
          </Box>

          <Tooltip title="Créditos">
            <IconButton
              color="inherit"
              onClick={() => navigate('/credits')}
              size="small"
              sx={{
                mr: 0.75,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Mis Tickets
          </Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={() => navigate('/create-ticket')}
            sx={{ px: 3 }}
          >
            + Nuevo Ticket
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ py: 2, px: 2.5, textAlign: 'center' }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: 'block', lineHeight: 1.2, letterSpacing: '0.08em' }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 0.75, color: stat.color }}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Accesos Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/tickets')}
              >
                Ver Todos los Tickets
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/tickets?status=open')}
              >
                Mis Tickets Abiertos
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/tickets?status=resolved')}
              >
                Historial
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
