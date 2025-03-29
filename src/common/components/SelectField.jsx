import React, { useEffect, useState } from 'react';
import {
  FormControl, InputLabel, MenuItem, Select, Autocomplete, TextField,
} from '@mui/material';
import { useEffectAsync } from '../../reactHelper';
import { List } from 'react-virtualized';

const SelectField = ({
  label,
  fullWidth,
  multiple,
  value = null,
  emptyValue = null,
  emptyTitle = '',
  onChange,
  endpoint,
  data,
  keyGetter = (item) => item.id,
  titleGetter = (item) => item.name,
}) => {
  const [items, setItems] = useState([]);

  const getOptionLabel = (option) => {
    if (typeof option !== 'object') {
      option = items.find((obj) => keyGetter(obj) === option);
    }
    return option ? titleGetter(option) : emptyTitle;
  };

  useEffect(() => setItems(data), [data]);

  useEffectAsync(async () => {
    if (endpoint) {
      const response = await fetch(endpoint);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    }
  }, []);

  const rowRenderer = ({ index, key, style }) => {
    const item = items[index];
    return (
      <MenuItem key={key} value={keyGetter(item)} style={style}>
        {titleGetter(item)}
      </MenuItem>
    );
  };

  if (items.length > 0) {
    return (
      <FormControl fullWidth={fullWidth}>
        {multiple ? (
          <>
            <InputLabel>{label}</InputLabel>
            <Select
              label={label}
              multiple
              value={value}
              onChange={onChange}
            >
              <List
                width={300}
                height={200}
                rowCount={items.length}
                rowHeight={35}
                rowRenderer={rowRenderer}
              />
            </Select>
          </>
        ) : (
          <Autocomplete
            size="small"
            options={items}
            getOptionLabel={getOptionLabel}
            renderOption={(props, option) => (
              <MenuItem {...props} key={keyGetter(option)} value={keyGetter(option)}>{titleGetter(option)}</MenuItem>
            )}
            isOptionEqualToValue={(option, value) => keyGetter(option) === value}
            value={value}
            onChange={(_, value) => onChange({ target: { value: value ? keyGetter(value) : emptyValue } })}
            renderInput={(params) => <TextField {...params} label={label} />}
            ListboxComponent={({ children, ...other }) => (
              <List
                {...other}
                width={300}
                height={200}
                rowCount={items.length}
                rowHeight={35}
                rowRenderer={({ index, key, style }) => (
                  <MenuItem key={key} value={keyGetter(items[index])} style={style}>
                    {titleGetter(items[index])}
                  </MenuItem>
                )}
              >
                {children}
              </List>
            )}
          />
        )}
      </FormControl>
    );
  }
  return null;
};

export default SelectField;
