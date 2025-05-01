import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useTranslation } from './LocalizationProvider';

const DateRangePicker = ({
  open,
  onClose,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  onApply,
  minDate,
  maxDate,
  maxDurationDays,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentPage, setCurrentPage] = useState(0);
  const [tempStartDate, setTempStartDate] = useState(fromDate ? dayjs(fromDate) : null);
  const [tempEndDate, setTempEndDate] = useState(toDate ? dayjs(toDate) : null);
  const [selectionPhase, setSelectionPhase] = useState('start');
  const [viewMode, setViewMode] = useState('days');
  const [currentViewDate, setCurrentViewDate] = useState(dayjs().startOf('month'));
  const t = useTranslation();

  // Safe date formatting helper
  const safeFormat = (dateObj, format) => {
    try {
      return dateObj ? dateObj.format(format) : '';
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Generate all months between min and max dates (or unlimited if no bounds)
  const months = useMemo(() => {
    try {
      if (minDate && maxDate) {
        const months = [];
        let current = dayjs(minDate).startOf('month');
        const end = dayjs(maxDate).startOf('month');

        while (current.isBefore(end) || current.isSame(end, 'month')) {
          months.push(current);
          current = current.add(1, 'month');
        }
        return months;
      }
      // Generate 24 months around the current view date for better navigation
      return Array.from({ length: 24 }, (_, i) => currentViewDate.add(i - 12, 'month').startOf('month'));
    } catch (error) {
      console.error('Error generating months:', error);
      return [dayjs().startOf('month')]; // Fallback to current month
    }
  }, [minDate, maxDate, currentViewDate]);

  // Get visible months based on current page
  const [visibleMonths, setVisibleMonths] = useState([]);

  useEffect(() => {
    if (months && months.length > 0) {
      const pageIndex = Math.min(currentPage, months.length - 1);
      const nextIndex = Math.min(pageIndex + 1, months.length - 1);

      const newVisibleMonths = isMobile
        ? [months[pageIndex]]
        : [months[pageIndex], months[nextIndex]];

      setVisibleMonths(newVisibleMonths);
    }
  }, [isMobile, currentPage, months]);

  useEffect(() => {
    if (viewMode === 'days' && months.length > 0) {
      const monthIndex = months.findIndex((m) => m.month() === currentViewDate.month()
                && m.year() === currentViewDate.year());

      if (monthIndex >= 0) {
        const newPage = isMobile ? monthIndex : Math.floor(monthIndex / 2) * 2;
        setCurrentPage(Math.max(0, Math.min(newPage, months.length - (isMobile ? 1 : 2))));
      }
    }
  }, [currentViewDate, months, viewMode, isMobile]);

  // Handle date selection with improved logic
  const handleDateClick = (date) => {
    if (!date) return;

    try {
      if (selectionPhase === 'start' || !tempStartDate) {
        setTempStartDate(date);
        setTempEndDate(null);
        setSelectionPhase('end');
      } else {
        // If selecting end date
        if (date.isBefore(tempStartDate)) {
          // If end date is before start date, swap them
          setTempEndDate(tempStartDate);
          setTempStartDate(date);
        } else {
          // Check if the selection exceeds maxDurationDays
          if (maxDurationDays && date.diff(tempStartDate, 'day') >= maxDurationDays) {
            // If exceeding, set end date to max allowed duration from start date
            const adjustedEndDate = tempStartDate.add(maxDurationDays - 1, 'day');
            setTempEndDate(adjustedEndDate);
          } else {
            // If within allowed range, use selected date
            setTempEndDate(date);
          }
        }tempStartDate;
        setSelectionPhase('start');
      }
    } catch (error) {
      console.error('Error handling date selection:', error);
    }
  };

  // Navigation functions with currentViewDate sync
  const handleNext = () => {
    try {
      const nextPage = Math.min(currentPage + (isMobile ? 1 : 2), months.length - (isMobile ? 1 : 2));
      setCurrentPage(nextPage);

      // Update currentViewDate to match the new page
      if (months[nextPage]) {
        setCurrentViewDate(months[nextPage]);
      }
    } catch (error) {
      console.error('Error navigating to next month:', error);
    }
  };

  const handlePrev = () => {
    try {
      const prevPage = Math.max(currentPage - (isMobile ? 1 : 2), 0);
      setCurrentPage(prevPage);

      // Update currentViewDate to match the new page
      if (months[prevPage]) {
        setCurrentViewDate(months[prevPage]);
      }
    } catch (error) {
      console.error('Error navigating to previous month:', error);
    }
  };

  // Month/year selection handlers with improved synchronization
  const handleMonthSelect = (month) => {
    try {
      const newViewDate = currentViewDate.month(month);
      setCurrentViewDate(newViewDate);
      setViewMode('days');
    } catch (error) {
      console.error('Error selecting month:', error);
      setViewMode('days');
    }
  };

  const handleYearSelect = (year) => {
    try {
      const newViewDate = currentViewDate.year(year);
      setCurrentViewDate(newViewDate);
      setViewMode('months');
    } catch (error) {
      console.error('Error selecting year:', error);
      setViewMode('months');
    }
  };

  const handleDecadeNavigation = (direction) => {
    try {
      setCurrentViewDate(currentViewDate.add(direction * 10, 'year'));
    } catch (error) {
      console.error('Error navigating decades:', error);
    }
  };

  const handleYearNavigation = (direction) => {
    try {
      setCurrentViewDate(currentViewDate.add(direction * 1, 'year'));
    } catch (error) {
      console.error('Error navigating years:', error);
    }
  };

  // Initialize when dialog opens with improved error handling
  useEffect(() => {
    if (open) {
      try {
        // Use start date if available, or end date if start date is not available, or today's date
        let initialDate;
        if (fromDate) {
          initialDate = dayjs(fromDate);
        } else if (toDate) {
          initialDate = dayjs(toDate);
        } else {
          initialDate = dayjs();
        }

        const initialStartDate = fromDate ? dayjs(fromDate) : null;
        let initialEndDate = toDate ? dayjs(toDate) : null;

        // Check if existing range exceeds max duration
        if (maxDurationDays && initialStartDate && initialEndDate) {
          const duration = initialEndDate.diff(initialStartDate, 'day') + 1;
          if (duration > maxDurationDays) {
            // Adjust end date to respect max duration
            initialEndDate = initialStartDate.add(maxDurationDays - 1, 'day');
          }
        }

        setTempStartDate(initialStartDate);
        setTempEndDate(initialEndDate);
        setSelectionPhase(fromDate && !toDate ? 'end' : 'start');

        const initialViewDate = initialDate.startOf('month');
        setCurrentViewDate(initialViewDate);
        setViewMode('days');

        // Find the index of the initial month after months are calculated
        setTimeout(() => {
          const monthIndex = months.findIndex((m) => m.month() === initialViewDate.month()
                        && m.year() === initialViewDate.year());

          if (monthIndex >= 0) {
            const newPage = isMobile ? monthIndex : Math.floor(monthIndex / 2) * 2;
            setCurrentPage(Math.max(0, Math.min(newPage, months.length - (isMobile ? 1 : 2))));
          }
        }, 0);
      } catch (error) {
        console.error('Error initializing date picker:', error);

        // Set safe defaults
        setTempStartDate(null);
        setTempEndDate(null);
        setSelectionPhase('start');
        setCurrentViewDate(dayjs().startOf('month'));
        setViewMode('days');
        setCurrentPage(0);
      }
    }
  }, [open, fromDate, toDate, isMobile]);

  // Render days view for a specific month with improved styling
  const renderDays = (monthStart) => {
    if (!monthStart) return null;

    try {
      const daysInMonth = monthStart.daysInMonth();
      const firstDayOfMonth = monthStart.day();
      const days = [];

      // Add empty slots for days before first of month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.unshift(null);
      }

      // Add all days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(monthStart.date(i));
      }

      return (
        <Box
          key={safeFormat(monthStart, 'MM-YYYY')}
          sx={{
            width: '100%',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            px: 1,
          }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                onClick={() => setViewMode('months')}
                sx={{ cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}
              >
                {safeFormat(monthStart, 'MMMM')}
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                onClick={() => setViewMode('years')}
                sx={{ cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}
              >
                {safeFormat(monthStart, 'YYYY')}
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={handlePrev}
                disabled={currentPage === 0}
                sx={{ color: theme.palette.text.secondary }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleNext}
                disabled={currentPage >= months.length - (isMobile ? 1 : 2)}
                sx={{ color: theme.palette.text.secondary }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {[t('calendarSundayShort'), t('calendarMondayShort'), t('calendarTuesdayShort'),
              t('calendarWednesdayShort'), t('calendarThursdayShort'),
              t('calendarFridayShort'), t('calendarSaturdayShort')].map((day) => (
                <Typography
                  key={day}
                  textAlign="center"
                  variant="caption"
                  color="text.secondary"
                  sx={{ p: 1 }}
                >
                  {day}
                </Typography>
            ))}
            {days.map((day, index) => {
              if (!day) {
                return <Box key={`empty-${monthStart.month()}-${index}`} sx={{ aspectRatio: 1 }} />;
              }

              const isDisabled = (minDate && day.isBefore(dayjs(minDate), 'day'))
                                || (maxDate && day.isAfter(dayjs(maxDate), 'day'));

              const isStart = tempStartDate && day.isSame(tempStartDate, 'day');
              const isEnd = tempEndDate && day.isSame(tempEndDate, 'day');
              const isInRange = tempStartDate && tempEndDate
                                && day.isAfter(tempStartDate)
                                && day.isBefore(tempEndDate);
              const isToday = day.isSame(dayjs(), 'day');

              return (
                <Box
                  key={safeFormat(day, 'DD-MM-YYYY')}
                  onClick={() => !isDisabled && handleDateClick(day)}
                  sx={{
                    aspectRatio: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDisabled ? 'default' : 'pointer',
                    position: 'relative',

                    // Improved border radius logic
                    ...(isStart && {
                      borderRadius: isEnd ? '50%' : '50% 0 0 50%',
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }),
                    ...(isEnd && {
                      borderRadius: isStart ? '50%' : '0 50% 50% 0',
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }),
                    ...(isInRange && {
                      backgroundColor: theme.palette.action.selected,
                      borderRadius: 0,
                    }),
                    ...((!isStart && !isEnd && !isInRange) && {
                      borderRadius: 2,
                    }),

                    '&:hover': {
                      backgroundColor: isDisabled ? 'transparent'
                        : (isStart || isEnd) ? theme.palette.primary.dark
                          : isInRange ? theme.palette.action.hover : theme.palette.action.hover,
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDisabled ? `${theme.palette.text.disabled} !important`
                        : isStart || isEnd ? `${theme.palette.primary.contrastText} !important`
                          : isToday ? `${theme.palette.primary.main} !important`
                            : `${theme.palette.text.primary} !important`,
                      fontWeight: (isStart || isEnd || isToday) ? 800 : 400,
                    }}
                  >
                    {day.date()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering days:', error);
      return <Typography color="error">Error rendering calendar</Typography>;
    }
  };

  // Render months selection view
  const renderMonths = () => {
    try {
      const currentYear = currentViewDate.year();
      const monthsList = Array.from({ length: 12 }, (_, i) => i);

      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => handleYearNavigation(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6" onClick={() => setViewMode('years')} sx={{ cursor: 'pointer' }}>
              {currentYear}
            </Typography>
            <IconButton onClick={() => handleYearNavigation(1)}>
              <ChevronRight />
            </IconButton>
          </Box>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}
          >
            {monthsList.map((month) => {
              const monthDate = dayjs().year(currentYear).month(month);
              const isCurrentMonth = month === currentViewDate.month()
                                && currentYear === currentViewDate.year();
              const isDisabled = (minDate && monthDate.endOf('month').isBefore(dayjs(minDate)))
                                || (maxDate && monthDate.startOf('month').isAfter(dayjs(maxDate)));

              return (
                <Button
                  key={month}
                  onClick={() => !isDisabled && handleMonthSelect(month)}
                  disabled={isDisabled}
                  sx={{
                    py: 1.5,
                    borderRadius: 1,
                    fontWeight: isCurrentMonth ? 600 : 400,
                    color: isDisabled ? theme.palette.text.disabled
                      : isCurrentMonth ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isDisabled ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  {safeFormat(monthDate, 'MMM')}
                </Button>
              );
            })}
          </Box>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering months:', error);
      return <Typography color="error">Error rendering months</Typography>;
    }
  };

  // Render years selection view
  const renderYears = () => {
    try {
      const startYear = Math.floor(currentViewDate.year() / 10) * 10 - 1;
      const yearsList = Array.from({ length: 12 }, (_, i) => startYear + i);

      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => handleDecadeNavigation(-10)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6">
              {`${yearsList[1]} - ${yearsList[yearsList.length - 2]}`}
            </Typography>
            <IconButton onClick={() => handleDecadeNavigation(10)}>
              <ChevronRight />
            </IconButton>
          </Box>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}
          >
            {yearsList.map((year) => {
              const yearDate = dayjs().year(year);
              const isCurrentYear = year === currentViewDate.year();
              const isDisabled = (minDate && yearDate.endOf('year').isBefore(dayjs(minDate)))
                                || (maxDate && yearDate.startOf('year').isAfter(dayjs(maxDate)));

              return (
                <Button
                  key={year}
                  onClick={() => !isDisabled && handleYearSelect(year)}
                  disabled={isDisabled}
                  sx={{
                    py: 1.5,
                    borderRadius: 1,
                    fontWeight: isCurrentYear ? 600 : 400,
                    color: isDisabled ? theme.palette.text.disabled
                      : isCurrentYear ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isDisabled ? 'transparent' : theme.palette.action.hover,
                    },
                  }}
                >
                  {year}
                </Button>
              );
            })}
          </Box>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering years:', error);
      return <Typography color="error">Error rendering years</Typography>;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.default,
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText,
          padding: theme.spacing(2),
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize="1rem" fontWeight={700} lineHeight={1.5}>
              {t('calendarFrom')}
            </Typography>
            <Typography fontSize="0.9rem" fontWeight={500} lineHeight={1.5}>
              {tempStartDate ? safeFormat(tempStartDate, 'MMMM D, YYYY') : t('calendarNotSelected')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize="1rem" fontWeight={700} lineHeight={1.5}>
              {t('calendarTo')}
            </Typography>
            <Typography fontSize="0.9rem" fontWeight={500} lineHeight={1.5}>
              {tempEndDate ? safeFormat(tempEndDate, 'MMMM D, YYYY') : t('calendarNotSelected')}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        overflowX: 'hidden',
        p: 0,
        backgroundColor: theme.palette.background.paper,
      }}
      >
        {(viewMode === 'days' && visibleMonths && visibleMonths.length > 0) && (
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflowX: isMobile ? 'hidden' : 'auto',
          overflowY: isMobile ? 'auto' : 'hidden',
          gap: 2,
          justifyContent: 'center',
          alignItems: 'stretch',
          p: 2,
        }}
        >
          {visibleMonths.map((month) => renderDays(month))}
        </Box>
        )}
        {viewMode === 'months' && renderMonths()}
        {viewMode === 'years' && renderYears()}
      </DialogContent>

      <DialogActions sx={{
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        p: 2,
      }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={() => {
            setFromDate(tempStartDate || null);
            setToDate(tempEndDate || null);

            console.log(tempStartDate, tempEndDate);
            if (typeof onApply === 'function') {
              onApply();
            }
            onClose();
          }}
          variant="contained"
          disabled={!tempStartDate || !tempEndDate}
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          {t('sharedApply')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateRangePicker;
