import {
  Button, Dialog, DialogContent, DialogTitle, Divider, Grid, Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from './LocalizationProvider';
import { devicesActions, reportsActions } from '../../store';
import DateRangePicker from './DateRangePicker';

export default function PlaybackDurationDialog({ deviceId, open, onClose }) {
  const t = useTranslation();
  const [customRangePick, setCustomRangePick] = useState(false);
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const navigate = useNavigate();
  const definedOptions = {
    today: t('reportToday'),
    yesterday: t('reportYesterday'),
    thisWeek: t('reportThisWeek'),
    previousWeek: t('reportPreviousWeek'),
  };

  const handlePeriodSelect = (period) => {
    generateDatesFromPeriod(period);
  };

  const generateDatesFromPeriod = (period) => {
    let selectedFrom;
    let selectedTo;
    switch (period) {
      case 'today':
        selectedFrom = dayjs().startOf('day');
        selectedTo = dayjs().endOf('day');
        break;
      case 'yesterday':
        selectedFrom = dayjs().subtract(1, 'day').startOf('day');
        selectedTo = dayjs().subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        selectedFrom = dayjs().startOf('week');
        selectedTo = dayjs().endOf('week');
        break;
      case 'previousWeek':
        selectedFrom = dayjs().subtract(1, 'week').startOf('week');
        selectedTo = dayjs().subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        selectedFrom = dayjs().startOf('month');
        selectedTo = dayjs().endOf('month');
        break;
      case 'previousMonth':
        selectedFrom = dayjs().subtract(1, 'month').startOf('month');
        selectedTo = dayjs().subtract(1, 'month').endOf('month');
        break;
    }

    setFromDate(selectedFrom);
    setToDate(selectedTo);
    handleCustomPeriodSelect(selectedFrom, selectedTo);
  };

  const handleCustomPeriodSelect = (from, to) => {
    reportsActions.updateFrom(from);
    reportsActions.updateTo(to);
    devicesActions.selectId(deviceId);
    navigate(`/replay?from=${from.toISOString()}&to=${to.toISOString()}&deviceId=${deviceId}`);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth>
        <DialogTitle>
          <Typography>{t('reportChooseInterval')}</Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            { Object.entries(definedOptions).map(([key, label]) => (
              <Grid item key={key} xs={6}>
                <Button variant="contained" fullWidth onClick={() => handlePeriodSelect(key)}>{label}</Button>
              </Grid>
            )) }
            <Grid item xs={12}>
              <Button variant="contained" fullWidth onClick={() => setCustomRangePick(true)}>{t('reportCustom')}</Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <DateRangePicker
        open={customRangePick}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        onApply={() => {
          handleCustomPeriodSelect(fromDate, toDate);
        }}
        onClose={() => setCustomRangePick(false)}
      />
    </>
  );
}
