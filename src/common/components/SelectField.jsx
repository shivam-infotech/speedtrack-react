import React, { useEffect, useState, forwardRef } from 'react';
import {
  FormControl, InputLabel, MenuItem, Select, Autocomplete, TextField,
} from '@mui/material';
import { FixedSizeList } from 'react-window';

const LISTBOX_PADDING = 8; // px

// Row renderer for react-window, adjusting for padding.
const renderRow = ({ data, index, style }) => {
  // Clone the option element, merging the style
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: style.top + LISTBOX_PADDING,
    },
  });
};

const ListboxComponent = forwardRef(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  // Convert children to an array of elements
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 35; // height for each row
  // Calculate total height or use a max height (here, 200px)
  const height = Math.min(200, itemCount * itemSize + 2 * LISTBOX_PADDING);

  return (
    <div ref={ref} {...other}>
      <FixedSizeList
        height={height}
        width="100%"
        itemData={itemData}
        overscanCount={5}
        itemSize={itemSize}
        itemCount={itemCount}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});

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

  // Update items when data prop changes.
  useEffect(() => {
    setItems(data);
  }, [data]);

  // Fetch data if an endpoint is provided.
  useEffect(() => {
    async function fetchData() {
      if (endpoint) {
        const response = await fetch(endpoint);
        if (response.ok) {
          const json = await response.json();
          setItems(json);
        } else {
          throw Error(await response.text());
        }
      }
    }
    fetchData();
  }, [endpoint]);

  if (!items || items.length === 0) {
    return null;
  }

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
            // For multiple selections, render all items without virtualization
          >
            {items.map((item) => (
              <MenuItem key={keyGetter(item)} value={keyGetter(item)}>
                {titleGetter(item)}
              </MenuItem>
            ))}
          </Select>
        </>
      ) : (
        <Autocomplete
          size="small"
          options={items}
          getOptionLabel={getOptionLabel}
          renderOption={(props, option) => (
            <MenuItem
              {...props}
              key={keyGetter(option)}
              value={keyGetter(option)}
            >
              {titleGetter(option)}
            </MenuItem>
          )}
          isOptionEqualToValue={(option, value) =>
            keyGetter(option) === value
          }
          // Match the stored value with the correct item from items.
          value={items.find((item) => keyGetter(item) === value) || null}
          onChange={(_, newValue) =>
            onChange({
              target: { value: newValue ? keyGetter(newValue) : emptyValue },
            })
          }
          renderInput={(params) => <TextField {...params} label={label} />}
          ListboxComponent={ListboxComponent}
        />
      )}
    </FormControl>
  );
};

export default SelectField;
