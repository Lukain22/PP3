import { useState, type ReactNode } from 'react';
import { Box, TextField } from '@mui/material';

interface InlineEditSelectProps {
  value: string | number;
  display: ReactNode;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}

export default function InlineEditSelect({
  value,
  display,
  disabled = false,
  onChange,
  children
}: InlineEditSelectProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setEditing(true);
        }}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1,
          px: 0.5,
          mx: -0.5,
          ...(!disabled && {
            '&:hover': { bgcolor: 'action.hover' }
          })
        }}
      >
        {display}
      </Box>
    );
  }

  return (
    <TextField
      select
      size="small"
      value={value}
      autoFocus
      SelectProps={{
        open: true,
        onClose: () => setEditing(false)
      }}
      onChange={(e) => {
        onChange(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      fullWidth
    >
      {children}
    </TextField>
  );
}
