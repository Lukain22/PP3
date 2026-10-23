import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

export interface SearchableOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string | number;
  options: SearchableOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  autoFocus = false
}: SearchableSelectProps) {
  const optionsKey = options.map((option) => `${String(option.value)}\u0000${option.label}`).join('\u0001');
  const stableOptions = useMemo(
    () => options,
    // La identidad del array cambia en cada render del formulario. El contenido es la dependencia real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey]
  );
  const selected = useMemo(
    () => stableOptions.find((option) => String(option.value) === String(value)) ?? null,
    [stableOptions, value]
  );
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selected?.label ?? '');
  const typing = useRef(false);

  useEffect(() => {
    if (open) return;
    typing.current = false;
    setInputValue(selected?.label ?? '');
  }, [open, selected]);

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      autoHighlight
      autoSelect
      selectOnFocus
      handleHomeEndKeys
      options={stableOptions}
      value={selected}
      inputValue={inputValue}
      onInputChange={(_, next, reason) => {
        if (reason === 'input') {
          typing.current = true;
          setInputValue(next);
          setOpen(true);
          return;
        }
        if (reason === 'reset' && typing.current) return;
        typing.current = false;
        setInputValue(next);
      }}
      onChange={(_, option) => {
        typing.current = false;
        if (!option) return;
        onChange(String(option.value));
        setInputValue(option.label);
      }}
      filterOptions={(items, state) => {
        const query = normalize(state.inputValue.trim());
        const current = normalize(selected?.label ?? '');
        if (!query || query === current) return items;
        return items.filter((option) => normalize(option.label).includes(query));
      }}
      isOptionEqualToValue={(option, current) => String(option.value) === String(current.value)}
      getOptionLabel={(option) => option.label}
      noOptionsText="Sin resultados"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          autoFocus={autoFocus}
        />
      )}
      slotProps={{
        listbox: { sx: { maxHeight: 280 } }
      }}
    />
  );
}
