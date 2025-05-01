import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress, Typography } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import { useCatch } from '../../reactHelper';

const AddressValue = ({ latitude, longitude, originalAddress, noAutofetch = true }) => {
  const t = useTranslation();

  const addressEnabled = useSelector((state) => state.session.server.geocoderEnabled);

  const [address, setAddress] = useState();
  const [loading, setLoading] = useState(false);

  const fetchAddress = useCatch(async () => {
    if (addressEnabled && latitude && longitude) {
      setLoading(true);
      try {
        const query = new URLSearchParams({ latitude, longitude });
        const response = await fetch(`/api/server/geocode?${query.toString()}`);
        if (response.ok) {
          setAddress(await response.text());
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    setAddress(originalAddress);
    if (!originalAddress && addressEnabled && !noAutofetch) {
      fetchAddress();
    }
  }, [latitude, longitude, originalAddress, addressEnabled]);

  if (address) {
    return address;
  }

  return '....';
};

export default AddressValue;
